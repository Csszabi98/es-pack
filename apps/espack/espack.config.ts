import { createBuildProfiles } from 'src';
import { DefaultBuildProfiles, IBuilds, ImportFormat, Platforms } from './src/build/build.model';

// TODO: make builds dir specifiable only once!

const builds: IBuilds = {
    defaultBuildProfiles: createBuildProfiles(
        {
            platform: Platforms.NODE,
            format: ImportFormat.COMMON_JS,
            external: ['deep-equal', 'esbuild', 'joi']
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
                        banner: '#!/usr/bin/env node'
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
