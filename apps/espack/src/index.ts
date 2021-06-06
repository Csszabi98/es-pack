// Export the necessary models for defining typesafe configs and plugins
export type {
    IEspackBuilds,
    IEspackBuild,
    IEspackBuildResult,
    ICleanup,
    IEspackPlugin,
    IBasePluginContext,
    IBuildReadyPluginContext,
    IBuiltPluginContext,
    BuildProfile,
    BuildProfiles,
    IEntryAsset,
    IPluginHooks
} from './model';
export { Asset, BuildLifecycles, DefaultBuildProfiles, ImportFormat, Platforms } from './model';

/*
    Export commonly usable utility logic to other packages.

    As this logic is core to espack, the only options for sharing
    would be to create a package for it and not bundle it
    with espack to avoid the cycling dependencies
    (which would defeat the purpose of this repo).
 */
export { FileExtensions, isFile, checkAssetsExist, createBuildProfiles } from './utils';
export * from './builder/builder';
