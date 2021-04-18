import { createBuildProfiles, IBuilds, ImportFormat, Platforms } from '@espack/espack';
import { peerDependencies } from './package.json';

const builds: IBuilds = {
    defaultBuildProfiles: createBuildProfiles(
        {
            platform: Platforms.NODE,
            format: ImportFormat.COMMON_JS,
            external: ['sass', ...Object.keys(peerDependencies)]
        },
        { production: { minify: false } }
    ),
    builds: [
        {
            scripts: [
                {
                    src: './src/index.ts'
                }
            ]
        }
    ]
};

export default builds;
