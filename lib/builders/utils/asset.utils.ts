import path from 'path';
import fs from 'fs';
import {
	DEFAULT_ENTRY_ASSET_TRANSFORMATIONS,
	OUTPUT_DIR,
	ENTRY_POINT_NOT_EXISTS_ERROR_MESSAGE,
	NON_EXISTENT_ENTRY_POINTS_ANNOUNCEMENT_MESSAGE,
} from '../../build/build.constants';
import {
	EntryAsset,
	DefaultBuildProfiles,
	BuildProfiles,
	DeterministicEntryAsset,
	StringToDefaultBuildProfiles,
	ImportFormat,
} from '../../build/build.model';
import { checkAssetsExist } from './check-assets-exist';
import { getAssetFileName } from './get-asset-filename';
import { isFile, FileExtensions } from '../../utils/is-file';

export const createDeterministicEntryAsset = (
	script: EntryAsset,
	buildProfile: string = DefaultBuildProfiles.PROD,
	defaultBuildProfiles?: BuildProfiles
): DeterministicEntryAsset => {
	const defaultBuildProfile = StringToDefaultBuildProfiles[buildProfile] || DefaultBuildProfiles.PROD;
	const { src, buildProfiles } = script;
	if ((defaultBuildProfiles && defaultBuildProfiles[buildProfile]) || (buildProfiles && buildProfiles[buildProfile])) {
		const globalDefaultBuildProfile = DEFAULT_ENTRY_ASSET_TRANSFORMATIONS[defaultBuildProfile];
		const entryDefaultBuildProfile = defaultBuildProfiles && defaultBuildProfiles[buildProfile];
		const scriptDefaultBuildProfile = buildProfiles && buildProfiles[buildProfile];
		const result = {
			src,
			buildProfile: {
				...globalDefaultBuildProfile,
				...entryDefaultBuildProfile,
				...scriptDefaultBuildProfile,
			},
		};

		// Set import format to ESM if it hasn't been specified explicitly and code splitting is enabled
		if (result.buildProfile.codeSplitting && !entryDefaultBuildProfile?.format && !scriptDefaultBuildProfile?.format) {
			result.buildProfile.format = ImportFormat.ESM;
		}

		if (result.buildProfile.codeSplitting && result.buildProfile.format !== ImportFormat.ESM) {
			//TODO: Move this validation to a more appropriate place
			throw new Error(
				'Currently you can only use code splitting with the esm format, ' +
					'if you want to do so without the esm format. ' +
					'If you still want to use other import formats you can do so with a compat build using babel!'
			);
		}

		return result;
	}
	return {
		src,
		buildProfile: DEFAULT_ENTRY_ASSET_TRANSFORMATIONS[defaultBuildProfile],
	};
};

export const getOutputAsset = (asset: string): string => path.join(OUTPUT_DIR, getAssetFileName(asset));

export const copyAssets = async (assets: string[]): Promise<void> => {
	const copyJobs = assets.map(asset => {
		return fs.promises.copyFile(asset, getOutputAsset(asset));
	});
	await Promise.all(copyJobs);
};

export const checkScripts = (entries: EntryAsset[]): Promise<void> => {
	const allowedEntryPointExtensions = [
		FileExtensions.JAVASCRIPT,
		FileExtensions.TYPESCRIPT,
		FileExtensions.JSX,
		FileExtensions.TSX,
	];
	const nonEntryPoints = entries.filter(entryPoint => !isFile(entryPoint.src, ...allowedEntryPointExtensions));
	if (nonEntryPoints.length) {
		console.error('Some of your provided entry points have incorrect extensions:');
		nonEntryPoints.forEach(console.log);
		throw new Error('An entry point must have either one of the following file extensions: .js .jsx .ts .tsx');
	}
	return checkAssetsExist(
		entries.map(entry => entry.src),
		ENTRY_POINT_NOT_EXISTS_ERROR_MESSAGE,
		NON_EXISTENT_ENTRY_POINTS_ANNOUNCEMENT_MESSAGE
	);
};
