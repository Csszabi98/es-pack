import fs, { FSWatcher } from 'fs';
import path from 'path';
import minifyHtml from '@minify-html/js';
import {
    BuildLifecycles,
    checkAssetsExist,
    EspackPlugin,
    IBasePluginContext,
    IBuildReadyPluginContext,
    IBuiltPluginContext,
    ICleanup
} from '@espack/espack';
import { generateDefaultHtmlContent } from './utils/generate-default-html-content';
import { injectScripts } from './utils/inject-scripts';

interface IMinifyCfg {
    minifyJs?: boolean;
    minifyCss?: boolean;
}

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
}
interface IEspackHtmlPluginCommonOptionalOptions {
    inputFile?: string;
    inject?: string[];
    injectStyle?: string[];
    injectHtml?: IHtmlInjection;
    outdir?: string;
    minify?: boolean | IMinifyCfg;
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
        super('@espack/html-plugin', enabledLifecycles);
        this._options = {
            outputFile: 'index.html',
            ...options
        };
    }

    private async _buildHtml(filename?: string): Promise<string> {
        if (!filename) {
            return generateDefaultHtmlContent();
        }

        let result: string = fs.readFileSync(filename).toString();

        const minifyOptions: boolean | IMinifyCfg | undefined = this._options.minify;
        if (minifyOptions) {
            result = minifyHtml
                .minify(
                    result,
                    minifyHtml.createConfiguration(
                        typeof minifyOptions === 'boolean'
                            ? {
                                  minifyJs: false,
                                  minifyCss: false
                              }
                            : minifyOptions
                    )
                )
                .toString();
        }

        return result;
    }

    private _getOutputPath(context: IBuildReadyPluginContext | IBuiltPluginContext<string>): string {
        return path.join(context.buildsDir, this._options.outdir || '', path.basename(this._options.outputFile));
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

    private static _watcherFactory(outputPath: string, resource: string, onChange: (fileName: string) => void): FSWatcher {
        const watcher: FSWatcher = fs.watch(resource, { encoding: 'utf-8' }, (event, fileName) => {
            try {
                fs.unlinkSync(outputPath);
            } catch (e) {
                console.error(e);
            } finally {
                onChange(fileName);
                watcher.close();
            }
        });
        return watcher;
    }

    public registerCustomWatcher(context: IBuiltPluginContext<string>): ICleanup {
        const watchedResource: string | undefined = this._options.inputFile;

        let close: () => void = () => {};
        if (watchedResource) {
            let watcher: FSWatcher;

            type CreateWatcher = () => FSWatcher;
            const createWatcher: CreateWatcher = () =>
                EspackHtmlPlugin._watcherFactory(this._getOutputPath(context), watchedResource, fileName => {
                    this._options.inputFile = fileName;
                    this.afterBuild(context);
                    watcher = createWatcher();
                });

            watcher = createWatcher();

            close = () => {
                watcher.close();
            };
        }

        return { stop: close };
    }
}
