import { IBuilds, ImportFormat, Platforms } from 'espack';

const builds: IBuilds = {
    defaultBuildProfiles: {
        development: {
            platform: Platforms.NODE,
            format: ImportFormat.COMMON_JS
        },
        production: {
            minify: false,
            platform: Platforms.NODE,
            format: ImportFormat.COMMON_JS
        }
    },
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
