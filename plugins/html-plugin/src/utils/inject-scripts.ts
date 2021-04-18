import { FileExtensions, IBuildResult, ImportFormat, Platforms } from '@espack/espack';
import { OutputFile } from 'esbuild';
import path from 'path';
import { IEspackPluginState, INJECTION_POINT_MAP, InjectionPoint } from '../html-plugin';

const getInjectableAssets = (
    relativeBuildPath: string,
    outputFiles: OutputFile[],
    enabledInjections: string[] | undefined,
    isBrowserTarget: boolean
): string[] => {
    type MapToPublicPath = (outFile: OutputFile) => string;
    const mapToPublicPath: MapToPublicPath = ({ path: outPath }) => path.join(relativeBuildPath, path.basename(outPath));

    let injectables: string[] = [];
    if (enabledInjections) {
        injectables = outputFiles
            .map(mapToPublicPath)
            .filter(
                publicPath => enabledInjections.includes(publicPath) || enabledInjections.includes(path.basename(publicPath))
            );
    } else if (isBrowserTarget) {
        injectables = outputFiles.map(mapToPublicPath);
    }
    return injectables;
};

const getInjectables = (
    baseDir: string,
    buildResult: IBuildResult,
    enabledScriptInjections?: string[],
    enabledStyleInjections?: string[]
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
            isBrowserTarget
        );
        const injectableStyles: string[] = getInjectableAssets(
            relativeBuildPath,
            outputStyles,
            enabledStyleInjections,
            isBrowserTarget
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
    const { inject, injectStyle, injectHtml } = options;
    let html: string = pluginBuildResult;

    const allInjectableScripts: { path: string; module: boolean }[] = [];
    const allInjectableStyles: string[] = [];
    buildResults.forEach(buildResult => {
        const [injectableScripts, injectableStyles] = getInjectables(baseDir, buildResult, inject, injectStyle);
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
        `${allInjectableStyles.map(style => `<link rel="stylesheet" href="${style}">`).join('')}</head>`
    );
    html = html.replace(
        '</body>',
        `${allInjectableScripts
            .map(script => `<script${script.module ? ' type="module"' : ''} src="${script.path}"></script>`)
            .join('')}</body>`
    );

    if (injectHtml) {
        type DoInjection = (injectionPoint: InjectionPoint, injectableHtml: string) => void;
        const doInjection: DoInjection = (injectionPoint, injectableHtml) => {
            let replaceValue: string;
            if (injectionPoint === InjectionPoint.AFTER_HEAD_START || injectionPoint === InjectionPoint.AFTER_BODY_START) {
                replaceValue = `${injectionPoint}${injectableHtml}`;
            } else {
                replaceValue = `${injectableHtml}${injectionPoint}`;
            }
            html = html.replace(injectionPoint, replaceValue);
        };

        Object.keys(injectHtml).forEach(key => {
            const injectableHtml: string | undefined = injectHtml[key];
            if (injectableHtml) {
                doInjection(INJECTION_POINT_MAP[key], injectableHtml);
            }
        });
    }

    return html;
};
