import fs, { FSWatcher } from 'fs';
import path from 'path';
import { minify, Options } from 'html-minifier';
import {
    checkAssetsExist,
    DefaultBuildProfiles,
    IEspackPlugin,
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

const pluginName: string = '@es-pack/html-plugin';

const watcherFactory = (resource: string, onChange: (fileName: string) => Promise<void>): FSWatcher => {
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
};

//TODO: Separate into smaller parts
export const espackHtmlPluginFactory = (options: IEspackHtmlPluginOptions): IEspackPlugin<string> => {
    const validation: Joi.ValidationResult = htmlPluginOptionsSchema.validate(options);
    if (validation.error) {
        console.error(validation.error);
        throw new Error('Invalid constructor options!');
    }

    const isProd: boolean = process.env.NODE_ENV !== DefaultBuildProfiles.DEV;
    const deterministicOptions: IEspackPluginState = {
        outputFile: 'index.html',
        injectionSeparator: isProd ? '' : '\n',
        injectionPrefix: isProd ? '' : '    ', // Use 4 whitespaces
        define: {
            PUBLIC_URL: 'assets' // Default outdir of copy plugin
        },
        ...options
    };

    const buildHtml = async (filename?: string): Promise<string> => {
        if (!filename) {
            return generateDefaultHtmlContent();
        }

        let result: string = fs.readFileSync(filename).toString();
        result = injectHtml(result, deterministicOptions);

        const define: Record<string, string> = deterministicOptions.define;
        Object.keys(define).forEach(key => {
            result = result.replace(new RegExp(`%${key}%`, 'g'), define[key]);
        });

        const minifyOptions: boolean | Options | undefined = deterministicOptions.minify;
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
    };

    const getOutputPath = (context: IBuildReadyPluginContext | IBuiltPluginContext<string>): string => {
        return path.join(context.buildsDir, deterministicOptions.outputFile);
    };

    const onResourceCheck = async (): Promise<void> => {
        const filename: string | undefined = deterministicOptions.inputFile;
        if (filename) {
            return checkAssetsExist([filename]);
        }
    };

    const onBuild = async (): Promise<string> => {
        return buildHtml(deterministicOptions.inputFile);
    };

    const afterBuild = (context: IBuiltPluginContext<string>): void => {
        const { buildResults, pluginBuildResult } = context;

        const html: string = injectScripts(context.buildsDir, deterministicOptions, buildResults, pluginBuildResult);

        fs.writeFileSync(getOutputPath(context), html);
    };

    const registerCustomWatcher = (context: IBuiltPluginContext<string>): ICleanup => {
        const watchedResource: string | undefined = deterministicOptions.inputFile;

        let close: () => void = () => {};
        if (watchedResource) {
            const watcher: FSWatcher = watcherFactory(watchedResource, async () => {
                const label: string = `[watch] ${pluginName} build finished under`;
                console.time(label);
                console.log(`[watch] ${pluginName} build started...`);
                const result: string = await onBuild();
                afterBuild({
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
    };

    return {
        name: pluginName,
        onResourceCheck,
        onBuild,
        afterBuild,
        registerCustomWatcher
    };
};
