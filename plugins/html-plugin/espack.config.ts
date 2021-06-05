import { createBuildProfiles, IEspackBuilds, ImportFormat, Platforms, DefaultBuildProfiles } from '@es-pack/espack';
import { dependencies, peerDependencies } from './package.json';

const builds: IEspackBuilds = {
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
                    src: './src/index.ts',
                    buildProfiles: createBuildProfiles({
                        format: ImportFormat.COMMON_JS,
                        outdir: 'cjs'
                    })
                },
                {
                    src: './src/index.ts',
                    buildProfiles: createBuildProfiles({
                        format: ImportFormat.ESM,
                        outdir: 'esm'
                    })
                }
            ]
        }
    ]
};

export default builds;
