import fs, { FSWatcher } from 'fs';
import path from 'path';
import { minify, Options } from 'html-minifier';
import {
    BuildLifecycles,
    checkAssetsExist,
    DefaultBuildProfiles,
    EspackPlugin,
    IBasePluginContext,
    IBuildReadyPluginContext,
    IBuiltPluginContext,
    ICleanup
} from '@es-pack/espack';
import { generateDefaultHtmlContent } from './utils/generate-default-html-content';
import { injectScripts } from './utils/inject-scripts';
import { injectHtml } from './utils/inject-html';
import { htmlPluginOptionsSchema } from './validation/validator';
import Joi from 'joi';

export enum InjectionPoint {
    AFTER_HEAD_START = '<head>',
    BEFORE_HEAD_END = '</head>',
    AFTER_BODY_START = '<body>',
    BEFORE_BODY_END = '</body>'
}

export const INJECTION_POINT_MAP: Record<string, InjectionPoint> = {
    afterHeadStart: InjectionPoint.AFTER_HEAD_START,
    beforeHeadEnd: InjectionPoint.BEFORE_HEAD_END,
    afterBodyStart: InjectionPoint.AFTER_BODY_START,
    beforeBodyEnd: InjectionPoint.BEFORE_BODY_END
};

export interface IHtmlInjection {
    afterHeadStart?: string;
    beforeHeadEnd?: string;
    afterBodyStart?: string;
    beforeBodyEnd?: string;
    [key: string]: string | undefined;
}

interface IEspackHtmlPluginCommonOptions {
    outputFile: string;
    injectionSeparator: string;
    injectionPrefix: string;
    define: Record<string, string>;
}
interface IEspackHtmlPluginCommonOptionalOptions {
    inputFile?: string;
    inject?: string[];
    injectStyle?: string[];
    injectHtml?: IHtmlInjection;
    minify?: boolean | Options;
    hashSeparator?: string;
}

export interface IEspackHtmlPluginOptions
    extends IEspackHtmlPluginCommonOptionalOptions,
        Partial<IEspackHtmlPluginCommonOptions> {}
export interface IEspackPluginState extends IEspackHtmlPluginCommonOptionalOptions, IEspackHtmlPluginCommonOptions {}

//TODO: Separate into smaller parts
export class EspackHtmlPlugin extends EspackPlugin<string> {
    private readonly _options: IEspackPluginState;

    public constructor(options: IEspackHtmlPluginOptions) {
        const enabledLifecycles: BuildLifecycles[] = [
            BuildLifecycles.RESOURCE_CHECK,
            BuildLifecycles.BUILD,
            BuildLifecycles.AFTER_BUILD,
            BuildLifecycles.WATCH
        ];
        super('@es-pack/html-plugin', enabledLifecycles);

        const validation: Joi.ValidationResult = htmlPluginOptionsSchema.validate(options);
        if (validation.error) {
            console.error(validation.error);
            throw new Error('Invalid constructor options!');
        }

        const isProd: boolean = process.env.NODE_ENV !== DefaultBuildProfiles.DEV;
        this._options = {
            outputFile: 'index.html',
            injectionSeparator: isProd ? '' : '\n',
            injectionPrefix: isProd ? '' : '    ', // Use 4 whitespaces
            define: {
                PUBLIC_URL: 'assets' // Default outdir of copy plugin
            },
            ...options
        };
    }

    private async _buildHtml(filename?: string): Promise<string> {
        if (!filename) {
            return generateDefaultHtmlContent();
        }

        let result: string = fs.readFileSync(filename).toString();
        result = injectHtml(result, this._options);

        const define: Record<string, string> = this._options.define;
        Object.keys(define).forEach(key => {
            result = result.replace(new RegExp(`%${key}%`, 'g'), define[key]);
        });

        const minifyOptions: boolean | Options | undefined = this._options.minify;
        if (minifyOptions) {
            result = minify(
                result,
                typeof minifyOptions === 'boolean'
                    ? {
                          removeComments: true,
                          collapseWhitespace: true
                      }
                    : minifyOptions
            );
        }

        return result;
    }

    private _getOutputPath(context: IBuildReadyPluginContext | IBuiltPluginContext<string>): string {
        return path.join(context.buildsDir, this._options.outputFile);
    }

    public async onResourceCheck(context: IBasePluginContext): Promise<void> {
        const filename: string | undefined = this._options.inputFile;
        if (filename) {
            return checkAssetsExist([filename]);
        }
    }

    public async onBuild(context: IBuildReadyPluginContext): Promise<string> {
        return this._buildHtml(this._options.inputFile);
    }

    public afterBuild(context: IBuiltPluginContext<string>): void {
        const { buildResults, pluginBuildResult } = context;

        const html: string = injectScripts(context.buildsDir, this._options, buildResults, pluginBuildResult);

        fs.writeFileSync(this._getOutputPath(context), html);
    }

    private static _watcherFactory(resource: string, onChange: (fileName: string) => Promise<void>): FSWatcher {
        return fs.watch(resource, { encoding: 'utf-8' }, async (event, fileName) => {
            if (event === 'rename') {
                console.error(
                    `Html entry point ${fileName} renamed! Please sync up the changes with the config and restart the watcher...`
                );
                process.exit(1);
                return;
            }
            await onChange(fileName);
        });
    }

    public registerCustomWatcher(context: IBuiltPluginContext<string>): ICleanup {
        const watchedResource: string | undefined = this._options.inputFile;

        let close: () => void = () => {};
        if (watchedResource) {
            const watcher: FSWatcher = EspackHtmlPlugin._watcherFactory(watchedResource, async fileName => {
                const label: string = `[watch] ${this.name} build finished under`;
                console.time(label);
                console.log(`[watch] ${this.name} build started...`);
                const result: string = await this.onBuild(context);
                this.afterBuild({
                    ...context,
                    pluginBuildResult: result
                });
                console.timeEnd(label);
            });

            close = () => {
                watcher.close();
            };
        }

        return { stop: close };
    }
}
