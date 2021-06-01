import * as esbuild from 'esbuild';
import type { IEspackPlugin } from './build.plugin';

export enum Asset {
    HTML = 'html',
    CSS = 'css',
    JS = 'js',
    JSX = 'jsx',
    TS = 'ts',
    TSX = 'tsx',
    PNG = 'png',
    ICO = 'ico',
    MANIFEST = 'webmanifest'
}

export enum Platforms {
    NODE = 'node',
    BROWSER = 'browser',
    NEUTRAL = 'neutral'
}

export enum ImportFormat {
    IIFE = 'iife',
    COMMON_JS = 'cjs',
    ESM = 'esm'
}

type OptionalEntryAssetTransformations = Omit<esbuild.BuildOptions, 'watch' | 'entryPoints' | 'write' | 'outfile' | 'stdin'>;

type RequiredEntryAssetTransformations = {
    [Key in keyof OptionalEntryAssetTransformations]-?: OptionalEntryAssetTransformations[Key];
};

type OmmitedEntryAssetTransformations =
    | 'footer'
    | 'metafile'
    | 'banner'
    | 'outbase'
    | 'outdir'
    | 'nodePaths'
    | 'outExtension'
    | 'publicPath'
    | 'chunkNames'
    | 'inject'
    | 'pure'
    | 'tsconfig';

export interface IEntryAssetTransformations
    extends Omit<RequiredEntryAssetTransformations, OmmitedEntryAssetTransformations>,
        Pick<OptionalEntryAssetTransformations, OmmitedEntryAssetTransformations> {}

export type BuildProfiles = Record<string, Partial<IEntryAssetTransformations> | undefined>;

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

export type DefaultEntryAssetTransformations = {
    [Key in DefaultBuildProfiles]: IEntryAssetTransformations;
};

export interface IBuild {
    buildProfiles?: BuildProfiles;
    // eslint-disable-next-line
    plugins?: IEspackPlugin<any>[];
    scripts: IEntryAsset[];
}

export interface IEntryAsset {
    src: string;
    buildProfiles?: BuildProfiles;
}

export type CommonEntryAsset = Omit<IEntryAsset, 'buildProfiles'>;
export interface ICommonBuild {
    buildProfile: BuildProfile;
    builds: CommonEntryAsset[];
}
export interface IBuildResult {
    buildId: string;
    build: ICommonBuild;
    buildResult: esbuild.BuildResult;
}

export interface IBuilds {
    buildsDir?: string;
    defaultBuildProfiles?: BuildProfiles;
    builds: IBuild[];
}

export type BuildProfile = IEntryAssetTransformations & {
    outdir: string;
};

export interface IProfiles {
    buildProfile: BuildProfile;
}

export interface IIncompleteProfiles {
    buildProfile: Partial<BuildProfile>;
}

// EntryAsset with a determined buildOption to use
export interface IDeterministicEntryAsset extends IProfiles {
    src: string;
}

export interface ICleanup {
    stop: () => void;
}
