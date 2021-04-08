import { IBuilds, IEntryAssetTransformations, ImportFormat, Platforms } from 'espack';

const commonProfileOptions: Partial<IEntryAssetTransformations> = {
    platform: Platforms.NODE,
    format: ImportFormat.COMMON_JS,
    excludePeerDependencies: true,
    external: ['sass']
};

const builds: IBuilds = {
    defaultBuildProfiles: {
        development: commonProfileOptions,
        production: {
            ...commonProfileOptions,
            minify: false
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
