import fs from 'fs';

const defaultErrorMessage = 'Could not find the following assets, check if all the assets you provided do exist!';
const defaultNonExistentAssetsAnnouncementMessage = 'The following assets are non existent:';

export const NonExistentAssetsError = new Error('There are some assets which does not exist!');

export const checkAssetsExistSync = (
	assets: string[] | undefined,
	errorMessage = defaultErrorMessage,
	nonExistentAssetsAnnouncementMessage = defaultNonExistentAssetsAnnouncementMessage
): void => {
	const nonExistentAssets = assets?.filter(asset => !fs.existsSync(asset));
	if (nonExistentAssets?.length) {
		console.error(errorMessage);
		console.error(nonExistentAssetsAnnouncementMessage);
		nonExistentAssets.forEach(console.error);
		throw NonExistentAssetsError;
	}
};

export const checkAssetsExist = (
	assets: string[] | undefined,
	errorMessage?: string,
	nonExistentAssetsAnnouncementMessage?: string
): Promise<void> =>
	new Promise((resolve, reject) => {
		try {
			checkAssetsExistSync(assets, errorMessage, nonExistentAssetsAnnouncementMessage);
			resolve(undefined);
		} catch (e) {
			reject(e);
		}
	});
