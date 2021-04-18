import { createBuildProfiles, DefaultBuildProfiles, IBuilds, ImportFormat, Platforms } from '@espack/espack';
import { EspackCopyPlugin } from '@espack/copy-plugin';
import { EspackHtmlPlugin, IHtmlInjection } from '@espack/html-plugin';

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
        'crossorigin="anonymous"></script>' +
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/17.0.2/cjs/react-dom.development.min.js" ' +
        'integrity="sha512-Wy3hcU/q1COKtaXcrG+JgUdTBucqiMEd+ViiaYTUluTHLAOF88R0LSJnE56rTwlAqS6/lqXxGZH0cHNXXzMEiw==" ' +
        'crossorigin="anonymous"></script>'
};

const injectHtml: IHtmlInjection = {
    beforeBodyEnd: isProdBuild ? reactScriptsMap[DefaultBuildProfiles.PROD] : reactScriptsMap[DefaultBuildProfiles.DEV]
};

const builds: IBuilds = {
    defaultBuildProfiles: createBuildProfiles(
        {
            platform: Platforms.BROWSER,
            format: ImportFormat.ESM,
            inject: ['./injectables/react-shim.mjs'],
            external: ['react', 'react-dom']
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
            ]
        }
    ],
    defaultPlugins: [
        new EspackCopyPlugin({
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
        new EspackHtmlPlugin({
            inputFile: './public/index.html',
            outputFile: './dist/index.html',
            minify: isProdBuild,
            injectHtml
        })
    ]
};

export default builds;
