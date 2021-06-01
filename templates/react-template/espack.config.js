import { createBuildProfiles, DefaultBuildProfiles, ImportFormat, Platforms } from '@es-pack/espack';
import { espackCopyPluginFactory } from '@es-pack/copy-plugin';
import { espackHtmlPluginFactory } from '@es-pack/html-plugin';

const NODE_ENV = 'process.env.NODE_ENV';
const isProdBuild = process.env.NODE_ENV === DefaultBuildProfiles.PROD;

export default {
    defaultBuildProfiles: createBuildProfiles(
        {
            platform: Platforms.BROWSER,
            format: ImportFormat.ESM,
            entryNames: `[dir]/[name]${isProdBuild ? '.[hash]' : ''}`,
            loader: {
                '.js': 'jsx'
            }
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
                    outputFile: 'index.html',
                    minify: isProdBuild
                })
            ]
        }
    ]
};
