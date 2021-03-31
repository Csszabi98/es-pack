import { Schema } from 'jsonschema';
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

const validJsVariableNamePattern = '[a-zA-Z_$][0-9a-zA-Z_$]*';
export const buildProfilesSchema: Schema = {
	id: '/BuildProfiles',
	type: 'object',
	properties: {
		minify: { type: 'boolean' },
		sourceMap: { type: 'boolean' },
		bundle: { type: 'boolean' },
		platfrom: { enum: ['node', 'browser', 'neutral'] },
		format: { enum: ['cjs', 'iife', 'esm'] },
		codeSplitting: { type: 'boolean' },
		environmentVariables: {
			type: 'object',
			patternProperties: {
				[validJsVariableNamePattern]: {
					type: 'string',
				},
			},
			minProperties: 1,
		},
	},
};

export const entryAssetSchema: Schema = {
	id: '/EntryAsset',
	type: 'object',
	properties: {
		src: { type: 'string' },
		buildProfiles: {
			type: 'object',
			patternProperties: {
				[validJsVariableNamePattern]: {
					$ref: buildProfilesSchema.$id,
				},
			},
			minProperties: 1,
		},
	},
	required: ['src'],
};

export const regularBuildSchema: Schema = {
	id: '/RegularBuild',
	type: 'object',
	properties: {
		scripts: { $ref: entryAssetSchema.$id },
		copyResources: {
			type: 'array',
			items: { type: 'string' },
		},
		defaultBuildProfiles: { $ref: buildProfilesSchema.$id },
	},
	required: ['scripts'],
};

export const clientBuildSchema: Schema = {
	id: '/ClientBuild',
	type: 'object',
	properties: {
		html: { type: 'string' },
		minifyHtml: { type: 'boolean' },
		scripts: { $ref: entryAssetSchema.$id },
		styles: { type: 'array' },
		copyResources: {
			type: 'array',
			items: { type: 'string' },
		},
		defaultBuildProfiles: { $ref: buildProfilesSchema.$id },
	},
	required: ['html', 'scripts'],
};

export const buildsSchema: Schema = {
	id: '/Builds',
	type: 'object',
	properties: {
		clientBuilds: {
			type: 'array',
			items: { $ref: clientBuildSchema.$id },
		},
		regularBuilds: {
			type: 'array',
			items: { $ref: regularBuildSchema.$id },
		},
	},
	required: ['clientBuilds', 'regularBuilds'],
};
