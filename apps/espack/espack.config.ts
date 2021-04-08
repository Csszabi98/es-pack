import { IBuilds, IEntryAssetTransformations, ImportFormat, Platforms } from './src/build/build.model';

// TODO: Add a factory function to make it easier to define common options for multiple profiles

const commonBuildProfileOptions: Partial<IEntryAssetTransformations> = {
    platform: Platforms.NODE,
    format: ImportFormat.COMMON_JS,
    external: ['deep-equal', 'esbuild', 'joi']
};

const commonEspackEntryBuildProfilesOptions: Partial<IEntryAssetTransformations> = {
    banner: '#!/usr/bin/env node'
};

const commonUtilsEntryBuildProfileOptions: Partial<IEntryAssetTransformations> = {
    outdir: 'asset'
};

const builds: IBuilds = {
    defaultBuildProfiles: {
        development: commonBuildProfileOptions,
        production: {
            ...commonBuildProfileOptions,
            minify: false
        }
    },
    builds: [
        {
            scripts: [
                {
                    src: './src/espack.ts',
                    buildProfiles: {
                        development: commonEspackEntryBuildProfilesOptions,
                        production: commonEspackEntryBuildProfilesOptions
                    }
                },
                {
                    src: './src/index.ts'
                },
                {
                    src: './src/utils/index.ts',
                    buildProfiles: {
                        development: commonUtilsEntryBuildProfileOptions,
                        production: commonUtilsEntryBuildProfileOptions
                    }
                }
            ]
        }
    ]
};

export default builds;
