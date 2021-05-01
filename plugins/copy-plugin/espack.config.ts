import { createBuildProfiles, IBuilds, ImportFormat, Platforms, DefaultBuildProfiles } from '@espack/espack';
import { peerDependencies, dependencies } from './package.json';

const builds: IBuilds = {
    defaultBuildProfiles: createBuildProfiles(
        {
            platform: Platforms.NODE,
            format: ImportFormat.COMMON_JS,
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
                    src: './src/index.ts'
                }
            ]
        }
    ]
};

export default builds;
