import { DefaultBuildProfiles, IBuilds, ImportFormat, Platforms, createBuildProfiles } from './src';
import { dependencies, peerDependencies } from './package.json';

const builds: IBuilds = {
    defaultBuildProfiles: createBuildProfiles(
        {
            platform: Platforms.NODE,
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
                    src: './src/index.ts',
                    buildProfiles: createBuildProfiles({
                        format: ImportFormat.ESM,
                        outdir: 'esm'
                    })
                },
                {
                    src: './src/index.ts',
                    buildProfiles: createBuildProfiles({
                        format: ImportFormat.COMMON_JS,
                        outdir: 'cjs'
                    })
                },
                {
                    src: './src/espack.ts',
                    buildProfiles: createBuildProfiles({
                        format: ImportFormat.COMMON_JS,
                        banner: {
                            js: '#!/usr/bin/env node'
                        }
                    })
                }
            ]
        }
    ]
};

export default builds;
