import * as esbuild from 'esbuild';
import type { EspackPlugin } from './build.plugin';
export declare enum Asset {
    HTML = "html",
    CSS = "css",
    JS = "js",
    JSX = "jsx",
    TS = "ts",
    TSX = "tsx",
    PNG = "png",
    ICO = "ico",
    MANIFEST = "webmanifest"
}
export declare enum Platforms {
    NODE = "node",
    BROWSER = "browser",
    NEUTRAL = "neutral"
}
export declare enum ImportFormat {
    IIFE = "iife",
    COMMON_JS = "cjs",
    ESM = "esm"
}
declare type OptionalEntryAssetTransformations = Omit<esbuild.BuildOptions, 'watch' | 'entryPoints' | 'write' | 'outfile' | 'stdin'>;
declare type RequiredEntryAssetTransformations = {
    [Key in keyof OptionalEntryAssetTransformations]-?: OptionalEntryAssetTransformations[Key];
};
declare type OmmitedEntryAssetTransformations = 'footer' | 'metafile' | 'banner' | 'outbase' | 'outdir' | 'nodePaths' | 'outExtension' | 'publicPath' | 'chunkNames' | 'inject' | 'pure';
export interface EspackOptions {
    excludePeerDependencies: boolean;
    buildsDir: string;
}
export interface EntryAssetTransformations extends Omit<RequiredEntryAssetTransformations, OmmitedEntryAssetTransformations>, Pick<OptionalEntryAssetTransformations, OmmitedEntryAssetTransformations>, EspackOptions {
}
export declare type BuildProfiles = Record<string, Partial<EntryAssetTransformations> | undefined>;
export declare enum DefaultBuildProfiles {
    DEV = "development",
    PROD = "production"
}
declare type StringToDefaultBuildProfilesType = {
    [key: string]: DefaultBuildProfiles | undefined;
};
export declare const StringToDefaultBuildProfiles: StringToDefaultBuildProfilesType;
export declare type DefaultEntryAssetTransformations = {
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
export declare type CommonEntryAsset = Omit<EntryAsset, 'buildProfiles'>;
export declare type CommonBuild = {
    buildProfile: BuildProfile;
    espackBuildProfile: EspackOptions;
    builds: CommonEntryAsset[];
};
export declare type BuildResult = {
    build: CommonBuild;
    buildResult: esbuild.BuildResult;
};
export interface Builds {
    defaultBuildProfiles?: BuildProfiles;
    defaultPlugins?: EspackPlugin[];
    builds: Build[];
}
export declare type BuildProfile = Omit<EntryAssetTransformations, 'excludePeerDependencies' | 'buildsDir'> & {
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
export interface DeterministicEntryAsset extends Profiles {
    src: string;
}
export declare type Cleanup = {
    stop: () => void;
};
export {};
