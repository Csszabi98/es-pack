import { Builds, ImportFormat, Platforms } from './lib/build/build.model';

const builds: Builds = {
    defaultBuildProfiles: {
        dev: {
            platform: Platforms.NODE,
            format: ImportFormat.COMMON_JS,
        },
        prod: {
            minify: false,
            platform: Platforms.NODE,
            format: ImportFormat.COMMON_JS,
        },
    },
    builds: [
        {
            scripts: [
                {
                    src: './lib/espack.ts',
                },
                {
                    src: './lib/index.ts',
                },
            ],
        },
    ],
};

export default builds;
