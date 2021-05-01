import { FileExtensions, IBuildResult, ImportFormat, Platforms } from '@es-pack/espack';
import { OutputFile } from 'esbuild';
import path from 'path';
import { IEspackPluginState } from '../html-plugin';

const getInjectableAssets = (
    relativeBuildPath: string,
    outputFiles: OutputFile[],
    enabledInjections: string[] | undefined,
    isBrowserTarget: boolean,
    hashSeparator?: string
): string[] => {
    type MapToPublicPath = (outFile: OutputFile) => string;
    const mapToPublicPath: MapToPublicPath = ({ path: outPath }) => path.join(relativeBuildPath, path.basename(outPath));

    let injectables: string[] = [];
    if (enabledInjections) {
        injectables = outputFiles.map(mapToPublicPath).filter(publicPath => {
            if (enabledInjections.includes(publicPath)) {
                return true;
            }

            const basename: string = path.basename(publicPath);
            if (enabledInjections.includes(basename)) {
                return true;
            }

            if (!hashSeparator) {
                return false;
            }
            const basenameParts: string[] = basename.split(hashSeparator);
            if (basenameParts.length < 2) {
                return false;
            }

            basenameParts.splice(basenameParts.length - 2, 1); // Remove hash
            return enabledInjections.includes(basenameParts.join(hashSeparator));
        });
    } else if (isBrowserTarget) {
        injectables = outputFiles.map(mapToPublicPath);
    }
    return injectables;
};

const getInjectables = (
    baseDir: string,
    buildResult: IBuildResult,
    enabledScriptInjections?: string[],
    enabledStyleInjections?: string[],
    hashSeparator?: string
): [string[], string[]] => {
    const outputFiles: OutputFile[] | undefined = buildResult.buildResult.outputFiles;
    if (outputFiles) {
        const isBrowserTarget: boolean = buildResult.build.buildProfile.platform === Platforms.BROWSER;

        const outputScripts: OutputFile[] = outputFiles.filter(file => file.path.endsWith(`.${FileExtensions.JAVASCRIPT}`));
        const outputStyles: OutputFile[] = outputFiles.filter(file => file.path.endsWith(`.${FileExtensions.CSS}`));

        const relativeBuildPath: string = path.relative(baseDir, buildResult.build.buildProfile.outdir);

        const injectableScripts: string[] = getInjectableAssets(
            relativeBuildPath,
            outputScripts,
            enabledScriptInjections,
            isBrowserTarget,
            hashSeparator
        );
        const injectableStyles: string[] = getInjectableAssets(
            relativeBuildPath,
            outputStyles,
            enabledStyleInjections,
            isBrowserTarget,
            hashSeparator
        );
        return [injectableScripts, injectableStyles];
    }
    return [[], []];
};

export const injectScripts = (
    baseDir: string,
    options: IEspackPluginState,
    buildResults: IBuildResult[],
    pluginBuildResult: string
): string => {
    const { inject, injectStyle, injectionSeparator, injectionPrefix, hashSeparator } = options;
    let html: string = pluginBuildResult;

    const allInjectableScripts: { path: string; module: boolean }[] = [];
    const allInjectableStyles: string[] = [];
    buildResults.forEach(buildResult => {
        const [injectableScripts, injectableStyles] = getInjectables(
            baseDir,
            buildResult,
            inject,
            injectStyle,
            hashSeparator
        );
        allInjectableScripts.push(
            ...injectableScripts.map(path => ({
                path,
                module: buildResult.build.buildProfile.format === ImportFormat.ESM
            }))
        );
        allInjectableStyles.push(...injectableStyles);
    });

    html = html.replace(
        '</head>',
        `${allInjectableStyles
            .map(style => `${injectionPrefix}<link rel="stylesheet" href="${style}">`)
            .join(injectionSeparator)}${injectionSeparator}</head>`
    );
    html = html.replace(
        '</body>',
        `${allInjectableScripts
            .map(
                script => `${injectionPrefix}<script${script.module ? ' type="module"' : ''} src="${script.path}"></script>`
            )
            .join(injectionSeparator)}${injectionSeparator}</body>`
    );

    return html;
};
