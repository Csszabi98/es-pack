import * as esbuild from 'esbuild';

type OptionalEntryAssetTransformations = Omit<esbuild.BuildOptions, 'watch' | 'entryPoints' | 'write' | 'outfile' | 'stdin'>;

type RequiredEntryAssetTransformations = {
    [Key in keyof OptionalEntryAssetTransformations]-?: OptionalEntryAssetTransformations[Key];
};

type OmittedEntryAssetTransformations =
    | 'footer'
    | 'metafile'
    | 'banner'
    | 'outbase'
    | 'nodePaths'
    | 'outExtension'
    | 'publicPath'
    | 'chunkNames'
    | 'inject'
    | 'pure'
    | 'tsconfig';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface BuildProfile
    extends Omit<RequiredEntryAssetTransformations, OmittedEntryAssetTransformations>,
        Pick<OptionalEntryAssetTransformations, OmittedEntryAssetTransformations> {}

export type BuildProfiles = Record<string, Partial<BuildProfile> | undefined>;

export enum DefaultBuildProfiles {
    DEV = 'development',
    PROD = 'production'
}

interface IStringToDefaultBuildProfilesType {
    [key: string]: DefaultBuildProfiles | undefined;
}
export const StringToDefaultBuildProfiles: IStringToDefaultBuildProfilesType = {
    [DefaultBuildProfiles.DEV]: DefaultBuildProfiles.DEV,
    [DefaultBuildProfiles.PROD]: DefaultBuildProfiles.PROD
};
