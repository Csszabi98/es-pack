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
    MANIFEST = 'webmanifest',
}

export enum Platforms {
    NODE = 'node',
    BROWSER = 'browser',
    NEUTRAL = 'neutral',
}

export enum ImportFormat {
    IIFE = 'iife',
    COMMON_JS = 'cjs',
    ESM = 'esm',
}

// TODO: Sanizize input for exlcuded values
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

export interface EspackOptions {
    excludePeerDependencies: boolean;
    buildsDir: string;
}

export interface EntryAssetTransformations
    extends Omit<RequiredEntryAssetTransformations, OmmitedEntryAssetTransformations>,
        Pick<OptionalEntryAssetTransformations, OmmitedEntryAssetTransformations>,
        EspackOptions {}

export type BuildProfiles = Record<string, Partial<EntryAssetTransformations> | undefined>;

export enum DefaultBuildProfiles {
    DEV = 'development',
    PROD = 'production',
}

type StringToDefaultBuildProfilesType = { [key: string]: DefaultBuildProfiles | undefined };
export const StringToDefaultBuildProfiles: StringToDefaultBuildProfilesType = {
    [DefaultBuildProfiles.DEV]: DefaultBuildProfiles.DEV,
    [DefaultBuildProfiles.PROD]: DefaultBuildProfiles.PROD,
};

export type DefaultEntryAssetTransformations = {
    [Key in DefaultBuildProfiles]: EntryAssetTransformations;
};

export interface Build {
    buildProfiles?: BuildProfiles;
    plugins?: EspackPlugin[];
    scripts: EntryAsset[];
}

export interface EntryAsset {
    src: string;
    buildProfiles?: BuildProfiles;
}

export type CommonEntryAsset = Omit<EntryAsset, 'buildProfiles'>;
export type CommonBuild = {
    buildProfile: BuildProfile;
    espackBuildProfile: EspackOptions;
    builds: CommonEntryAsset[];
};
export type BuildResult = {
    build: CommonBuild;
    buildResult: esbuild.BuildResult;
};

export interface Builds {
    defaultBuildProfiles?: BuildProfiles;
    defaultPlugins?: EspackPlugin[];
    builds: Build[];
}

export type BuildProfile = Omit<EntryAssetTransformations, 'excludePeerDependencies' | 'buildsDir'> & {
    watch: boolean;
    outdir: string;
};

export interface Profiles {
    espackBuildProfile: EspackOptions;
    buildProfile: BuildProfile;
}

export interface IncompleteProfiles {
    espackBuildProfile: Partial<EspackOptions>;
    buildProfile: Partial<BuildProfile>;
}

// EntryAsset with a determined buildOption to use
export interface DeterministicEntryAsset extends Profiles {
    src: string;
}

export type Cleanup = { stop: () => void };
