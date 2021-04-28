import { DefaultBuildProfiles, IBuilds, ImportFormat, Platforms, createBuildProfiles } from './src';
import { dependencies, peerDependencies } from './package.json';

const builds: IBuilds = {
    defaultBuildProfiles: createBuildProfiles(
        {
            platform: Platforms.NODE,
            format: ImportFormat.COMMON_JS,
            external: [...Object.keys(dependencies), ...Object.keys(peerDependencies)]
        },
        {
            [DefaultBuildProfiles.PROD]: {
                minify: false
            }
        }
    ),
    builds: [
        {
            scripts: [
                {
                    src: './src/espack.ts',
                    buildProfiles: createBuildProfiles({
                        banner: {
                            js: '#!/usr/bin/env node'
                        }
                    })
                },
                {
                    src: './src/index.ts'
                }
            ]
        }
    ]
};

export default builds;
