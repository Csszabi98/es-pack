import { DefaultBuildProfiles, DefaultEntryAssetTransformations, ImportFormat, Platforms } from './build.model';

export const OUTPUT_DIR = 'dist';

export const UI_ENTRY_POINT = 'index.html';
export const BUILD_ENCODING = 'utf-8';

export const DEFAULT_UI_ASSETS = [
	'android-chrome-192x192.png',
	'android-chrome-512x512.png',
	'apple-touch-icon.png',
	'favicon-16x16.png',
	'favicon-32x32.png',
	'favicon.ico',
	'site.webmanifest',
] as const;

export const ENTRY_POINT_NOT_EXISTS_ERROR_MESSAGE = 'Could not find the following entry points, check if all of them exist!';
export const NON_EXISTENT_ENTRY_POINTS_ANNOUNCEMENT_MESSAGE = 'The following entry points are non existent:';

export const DEFAULT_ENTRY_ASSET_TRANSFORMATIONS: DefaultEntryAssetTransformations = {
	[DefaultBuildProfiles.DEV]: {
		minify: false,
		sourcemap: true,
		bundle: true,
		format: ImportFormat.IIFE,
		codeSplitting: false,
		platform: Platforms.NEUTRAL,
	},
	[DefaultBuildProfiles.PROD]: {
		minify: true,
		sourcemap: false,
		bundle: true,
		format: ImportFormat.IIFE,
		codeSplitting: false,
		platform: Platforms.NEUTRAL,
	},
} as const;