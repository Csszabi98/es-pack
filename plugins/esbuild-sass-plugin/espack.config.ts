import { createBuildProfiles, IEspackBuilds, ImportFormat, Platforms } from '@es-pack/espack';
import { peerDependencies } from './package.json';

const builds: IEspackBuilds = {
    defaultBuildProfiles: createBuildProfiles(
        {
            platform: Platforms.NODE,
            external: ['sass', ...Object.keys(peerDependencies)]
        },
        { production: { minify: false } }
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
                }
            ]
        }
    ]
};

export default builds;
