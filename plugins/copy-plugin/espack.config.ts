import { createBuildProfiles, IBuilds, ImportFormat, Platforms, DefaultBuildProfiles } from '@es-pack/espack';
import { peerDependencies, dependencies } from './package.json';

const builds: IBuilds = {
    defaultBuildProfiles: createBuildProfiles(
        {
            platform: Platforms.NODE,
            external: [...Object.keys(peerDependencies), ...Object.keys(dependencies)]
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
                        outdir: 'cjs',
                        format: ImportFormat.COMMON_JS
                    })
                },
                {
                    src: './src/index.ts',
                    buildProfiles: createBuildProfiles({
                        outdir: 'esm',
                        format: ImportFormat.ESM
                    })
                }
            ]
        }
    ]
};

export default builds;
