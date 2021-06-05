import { createBuildProfiles, DefaultBuildProfiles, IEspackBuilds, ImportFormat, Platforms } from '@es-pack/espack';
import { espackCopyPluginFactory } from '@es-pack/copy-plugin';
import { espackHtmlPluginFactory, IHtmlInjection } from '@es-pack/html-plugin';
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals';
import React from 'react';

const NODE_ENV: string = 'process.env.NODE_ENV';
const isProdBuild: boolean = process.env.NODE_ENV === DefaultBuildProfiles.PROD;

interface IReactScriptsMap {
    [DefaultBuildProfiles.PROD]: string;
    [DefaultBuildProfiles.DEV]: string;
}
const reactScriptsMap: IReactScriptsMap = {
    [DefaultBuildProfiles.PROD]:
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/react/17.0.2/umd/react.production.min.js" ' +
        'integrity="sha512-qlzIeUtTg7eBpmEaS12NZgxz52YYZVF5myj89mjJEesBd/oE9UPsYOX2QAXzvOAZYEvQohKdcY8zKE02ifXDmA==" ' +
        'crossorigin="anonymous"></script>' +
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/17.0.2/umd/react-dom.production.min.js" ' +
        'integrity="sha512-9jGNr5Piwe8nzLLYTk8QrEMPfjGU0px80GYzKZUxi7lmCfrBjtyCc1V5kkS5vxVwwIB7Qpzc7UxLiQxfAN30dw==" ' +
        'crossorigin="anonymous"></script>',
    [DefaultBuildProfiles.DEV]:
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/react/17.0.2/umd/react.development.js" ' +
        'integrity="sha512-Vf2xGDzpqUOEIKO+X2rgTLWPY+65++WPwCHkX2nFMu9IcstumPsf/uKKRd5prX3wOu8Q0GBylRpsDB26R6ExOg==" ' +
        'crossorigin="anonymous"></script>\n    ' +
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/17.0.2/umd/react-dom.development.min.js" ' +
        'integrity="sha512-aNBFq6ue8EmNDwVD/l0mWFy3iVZLIxtQaD7fEYBn3HluJer36T1AhJK0THj6MKKfhZrexxWsKX1T16TxLZo6uQ==" ' +
        'crossorigin="anonymous"></script>'
};

const injectHtml: IHtmlInjection = {
    beforeBodyEnd: isProdBuild ? reactScriptsMap[DefaultBuildProfiles.PROD] : reactScriptsMap[DefaultBuildProfiles.DEV]
};

const builds: IEspackBuilds = {
    defaultBuildProfiles: createBuildProfiles(
        {
            platform: Platforms.BROWSER,
            format: ImportFormat.IIFE,
            inject: ['./shims/react-shim.mjs'],
            external: ['react', 'react-dom'],
            jsxFactory: 'createElement',
            jsxFragment: 'Fragment',
            entryNames: `[dir]/[name]${isProdBuild ? '.[hash]' : ''}`,
            plugins: [
                globalExternals({
                    react: {
                        varName: 'React',
                        defaultExport: false,
                        namedExports: Object.keys(React)
                    },
                    'react-dom': {
                        varName: 'ReactDOM',
                        defaultExport: false,
                        namedExports: ['render']
                    }
                })
            ]
        },
        {
            [DefaultBuildProfiles.DEV]: {
                define: {
                    [NODE_ENV]: DefaultBuildProfiles.DEV
                }
            },
            [DefaultBuildProfiles.PROD]: {
                define: {
                    [NODE_ENV]: DefaultBuildProfiles.PROD
                }
            }
        }
    ),
    builds: [
        {
            scripts: [
                {
                    src: './src/index.tsx'
                }
            ],
            plugins: [
                espackCopyPluginFactory({
                    basedir: './public',
                    assets: [
                        'android-chrome-192x192.png',
                        'android-chrome-512x512.png',
                        'apple-touch-icon.png',
                        'favicon.ico',
                        'favicon-16x16.png',
                        'favicon-32x32.png',
                        'manifest.json',
                        'robots.txt'
                    ]
                }),
                espackHtmlPluginFactory({
                    inputFile: './public/index.html',
                    minify: isProdBuild,
                    injectHtml
                })
            ]
        }
    ]
};

export default builds;
