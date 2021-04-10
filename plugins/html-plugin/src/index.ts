import fs, { FSWatcher } from 'fs';
import path from 'path';
import { minify, Options } from 'html-minifier';
import {
    BuildLifecycles,
    checkAssetsExist,
    EspackPlugin,
    FileExtensions,
    getAssetFileName,
    IBasePluginContext,
    IBuildReadyPluginContext,
    IBuildResult,
    IBuiltPluginContext,
    ICleanup,
    Platforms
} from '@espack/espack';
import { generateDefaultHtmlContent } from './utils/generate-default-html-content';
import { OutputFile } from 'esbuild';
import { mapOutputFileToPath } from './utils/map-output-file-to-path';

interface IEspackHtmlPluginCommonOptions {
    outputFilename: string;
}
interface IEspackHtmlPluginCommonOptionalOptions {
    filename?: string;
    inject?: string[];
    injectStyle?: string[];
    outdir?: string;
    minify?: boolean | Options;
}

interface IEspackHtmlPluginOptions extends IEspackHtmlPluginCommonOptionalOptions, Partial<IEspackHtmlPluginCommonOptions> {}
interface IEspackPluginState extends IEspackHtmlPluginCommonOptionalOptions, IEspackHtmlPluginCommonOptions {}

export class EspackHtmlPlugin extends EspackPlugin<string> {
    private readonly _options: IEspackPluginState;

    public constructor(options: IEspackHtmlPluginOptions) {
        const enabledLifecycles: BuildLifecycles[] = [
            BuildLifecycles.RESOURCE_CHECK,
            BuildLifecycles.BUILD,
            BuildLifecycles.REBUILD,
            BuildLifecycles.WATCH
        ];
        super('@espack/html-plugin', enabledLifecycles);
        this._options = {
            outputFilename: 'index.html',
            ...options
        };
    }

    private async _buildHtml(filename?: string): Promise<string> {
        if (!filename) {
            return generateDefaultHtmlContent();
        }

        let result: string = fs.readFileSync(filename).toString();

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

    private static _getInjectableAssets(
        outputFiles: OutputFile[],
        enabledInjections: string[] | undefined,
        isBrowserTarget: boolean
    ): string[] {
        let injectables: string[] = [];
        if (enabledInjections) {
            injectables = outputFiles
                .filter(({ path }) => enabledInjections.includes(path) || enabledInjections.includes(getAssetFileName(path)))
                .map(mapOutputFileToPath);
        } else if (isBrowserTarget) {
            injectables = outputFiles.map(mapOutputFileToPath);
        }
        return injectables;
    }

    private static _getInjectables(
        buildResult: IBuildResult,
        enabledScriptInjections?: string[],
        enabledStyleInjections?: string[]
    ): [string[], string[]] {
        const outputFiles: OutputFile[] | undefined = buildResult.buildResult.outputFiles;
        if (outputFiles) {
            const isBrowserTarget: boolean = buildResult.build.buildProfile.platform === Platforms.BROWSER;

            const outputScripts: OutputFile[] = outputFiles.filter(file =>
                file.path.endsWith(`.${FileExtensions.JAVASCRIPT}`)
            );
            const outputStyles: OutputFile[] = outputFiles.filter(file => file.path.endsWith(`.${FileExtensions.CSS}`));

            const injectableScripts: string[] = EspackHtmlPlugin._getInjectableAssets(
                outputScripts,
                enabledScriptInjections,
                isBrowserTarget
            );
            const injectableStyles: string[] = EspackHtmlPlugin._getInjectableAssets(
                outputStyles,
                enabledStyleInjections,
                isBrowserTarget
            );
            return [injectableScripts, injectableStyles];
        }
        return [[], []];
    }

    private static _injectScripts(
        options: IEspackPluginState,
        buildResults: IBuildResult[],
        pluginBuildResult: string
    ): string {
        const { inject, injectStyle } = options;
        let html: string = pluginBuildResult;

        const allInjectableScripts: string[] = [];
        const allInjectableStyles: string[] = [];
        buildResults.forEach(buildResult => {
            const [injectableScripts, injectableStyles] = EspackHtmlPlugin._getInjectables(buildResult, inject, injectStyle);
            allInjectableScripts.push(...injectableScripts);
            allInjectableStyles.push(...injectableStyles);
        });

        html = html.replace(
            '</head>',
            `${allInjectableStyles.map(style => `<link rel="stylesheet" href="${style}.css">`).join('')}</head>`
        );
        html = html.replace(
            '</body>',
            `${allInjectableScripts.map(script => `<script src="${script}.js"></script>`).join('')}</body>`
        );

        return html;
    }

    private _getOutputPath(context: IBuildReadyPluginContext | IBuiltPluginContext<string>): string {
        const buildsDir: string = EspackHtmlPlugin.getBuildsDir(context);
        return path.join(buildsDir, this._options.outdir || '', getAssetFileName(this._options.outputFilename));
    }

    public onResourceCheck(context: IBasePluginContext): Promise<void> {
        const filename: string | undefined = this._options.filename;
        if (filename) {
            return checkAssetsExist([filename]);
        }
        return Promise.resolve();
    }

    public async onBuild(context: IBuildReadyPluginContext): Promise<string> {
        return this._buildHtml(this._options.filename);
    }

    public afterBuild(context: IBuiltPluginContext<string>): void {
        const { buildResults, pluginBuildResult } = context;

        const html: string = EspackHtmlPlugin._injectScripts(this._options, buildResults, pluginBuildResult);

        fs.writeFileSync(this._getOutputPath(context), html);
    }

    public onRebuild(context: IBuiltPluginContext<string>): void {
        this.afterBuild(context);
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
        const watchedResource: string | undefined = this._options.filename;

        let close: () => void = () => {};
        if (watchedResource) {
            let watcher: FSWatcher;

            type CreateWatcher = () => FSWatcher;
            const createWatcher: CreateWatcher = () =>
                EspackHtmlPlugin._watcherFactory(this._getOutputPath(context), watchedResource, fileName => {
                    this._options.filename = fileName;
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
