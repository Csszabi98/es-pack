import { IBuilds, ImportFormat, Platforms } from './src/build/build.model';

const builds: IBuilds = {
    defaultBuildProfiles: {
        dev: {
            platform: Platforms.NODE,
            format: ImportFormat.COMMON_JS
        },
        prod: {
            minify: false,
            platform: Platforms.NODE,
            format: ImportFormat.COMMON_JS
        }
    },
    builds: [
        {
            scripts: [
                {
                    src: './lib/espack.ts'
                },
                {
                    src: './lib/index.ts'
                }
            ]
        }
    ]
};

export default builds;
