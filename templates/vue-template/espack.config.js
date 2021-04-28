import vuePlugin from 'esbuild-vue';
import { createBuildProfiles, DefaultBuildProfiles, ImportFormat, Platforms } from '@espack/espack';
import { EspackCopyPlugin } from '@espack/copy-plugin';
import { EspackHtmlPlugin } from '@espack/html-plugin';

const NODE_ENV = 'process.env.NODE_ENV';
const isProdBuild = process.env.NODE_ENV === DefaultBuildProfiles.PROD;

export default {
    defaultBuildProfiles: createBuildProfiles(
        {
            platform: Platforms.BROWSER,
            format: ImportFormat.ESM,
            entryNames: `[dir]/[name]${isProdBuild ? '.[hash]' : ''}`,
            plugins: [vuePlugin()]
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
                    src: './src/index.js'
                }
            ],
            plugins: [
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
                    minify: isProdBuild
                })
            ]
        }
    ]
};
