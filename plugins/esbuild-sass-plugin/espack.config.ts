import { createBuildProfiles, IBuilds, ImportFormat, Platforms } from '@espack/espack';

const builds: IBuilds = {
    defaultBuildProfiles: createBuildProfiles(
        {
            platform: Platforms.NODE,
            format: ImportFormat.COMMON_JS,
            external: ['sass'],
            excludePeerDependencies: true
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
