import * as esbuild from 'esbuild';
import type { EspackPlugin } from './build.plugin';

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

// TODO: Sanitize input for excluded values
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
    | 'pure';

export interface IEspackOptions {
    excludePeerDependencies: boolean;
    buildsDir: string;
}

export interface IEntryAssetTransformations
    extends Omit<RequiredEntryAssetTransformations, OmmitedEntryAssetTransformations>,
        Pick<OptionalEntryAssetTransformations, OmmitedEntryAssetTransformations>,
        IEspackOptions {}

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
    plugins?: EspackPlugin[];
    scripts: IEntryAsset[];
}

export interface IEntryAsset {
    src: string;
    buildProfiles?: BuildProfiles;
}

export type CommonEntryAsset = Omit<IEntryAsset, 'buildProfiles'>;
export interface ICommonBuild {
    buildProfile: BuildProfile;
    espackBuildProfile: IEspackOptions;
    builds: CommonEntryAsset[];
}
export interface IBuildResult {
    buildId: string;
    build: ICommonBuild;
    buildResult: esbuild.BuildResult;
}

export interface IBuilds {
    defaultBuildProfiles?: BuildProfiles;
    defaultPlugins?: EspackPlugin[];
    builds: IBuild[];
}

export type BuildProfile = Omit<IEntryAssetTransformations, 'excludePeerDependencies' | 'buildsDir'> & {
    outdir: string;
};

export interface IProfiles {
    espackBuildProfile: IEspackOptions;
    buildProfile: BuildProfile;
}

export interface IIncompleteProfiles {
    espackBuildProfile: Partial<IEspackOptions>;
    buildProfile: Partial<BuildProfile>;
}

// EntryAsset with a determined buildOption to use
export interface IDeterministicEntryAsset extends IProfiles {
    src: string;
}

export interface ICleanup {
    stop: () => void;
}
