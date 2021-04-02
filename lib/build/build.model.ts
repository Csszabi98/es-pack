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

export interface EntryAssetTransformations {
	minify: boolean;
	sourcemap: boolean;
	bundle: boolean;
	platform: Platforms;
	format: ImportFormat;
	codeSplitting: boolean;
	environmentVariables?: Record<string, string>;
	preact?: PreactBuildType;
	[key: string]: boolean | string | Record<string, string> | undefined | PreactBuildType | ImportFormat;
}

export type BuildProfiles = Record<string, Partial<EntryAssetTransformations> | undefined>;

export enum DefaultBuildProfiles {
	DEV = 'dev',
	PROD = 'production',
}

type StringToDefaultBuildProfilesType = { [key: string]: DefaultBuildProfiles | undefined };
export const StringToDefaultBuildProfiles: StringToDefaultBuildProfilesType = {
	[DefaultBuildProfiles.DEV]: DefaultBuildProfiles.DEV,
	[DefaultBuildProfiles.PROD]: DefaultBuildProfiles.PROD,
};

export type DefaultEntryAssetTransformations = {
	[k in DefaultBuildProfiles]: EntryAssetTransformations;
};

export type PreactBuildType = { development: boolean };

export interface RegularBuild {
	defaultBuildProfiles?: BuildProfiles;
	scripts: EntryAsset[];
	copyResources?: string[];
}

export interface ClientBuild extends RegularBuild {
	html: string;
	minifyHtml?: boolean;
	styles?: string[];
}

export interface EntryAsset {
	src: string;
	buildProfiles?: BuildProfiles;
}

export interface Builds {
	clientBuilds: ClientBuild[];
	regularBuilds: RegularBuild[];
}

// EntryAsset with a determined buildOption to use
export interface DeterministicEntryAsset {
	src: string;
	buildProfile: EntryAssetTransformations;
}

export type Cleanup = { stop: () => void };
