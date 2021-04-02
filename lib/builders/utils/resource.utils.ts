import fs from 'fs';
import {
	ENTRY_POINT_NOT_EXISTS_ERROR_MESSAGE,
	NON_EXISTENT_ENTRY_POINTS_ANNOUNCEMENT_MESSAGE,
	BUILD_ENCODING,
} from '../../build/build.constants';
import { Cleanup, Builds, EntryAsset } from '../../build/build.model';
import { checkAssetsExist } from './check-assets-exist';
import { getOutputAsset } from './asset.utils';

export const checkResources = (resources: string[]): Promise<void> =>
	checkAssetsExist(resources, ENTRY_POINT_NOT_EXISTS_ERROR_MESSAGE, NON_EXISTENT_ENTRY_POINTS_ANNOUNCEMENT_MESSAGE);

export type WatchedResource = {
	src: string;
	onRebuild?: (fileName: string) => void;
};

export const watchResources = (resources: WatchedResource[]): Promise<Cleanup> =>
	new Promise(resolve => {
		const watchers = resources.map((resource, index) => {
			const watcher = fs.watch(resource.src, { encoding: BUILD_ENCODING }, (event, fileName) => {
				if (event === 'rename') {
					try {
						fs.unlinkSync(resource.src);
					} catch (e) {
						console.error(e);
					} finally {
						watcher.close();
					}
				}

				const watchedResource = resources.splice(index, 1);
				resources.splice(index, 0, {
					...watchedResource,
					src: fileName,
				});

				if (resource.onRebuild) {
					resource.onRebuild(fileName);
				} else {
					fs.copyFileSync(fileName, getOutputAsset(fileName));
				}
			});
			return watcher;
		});
		const close = (): void => {
			watchers.forEach(watcher => watcher.close());
		};
		resolve({ stop: close });
	});

// This can be removed if all builds will be under their own subdirectory,
// and the check can be deferred to once/subdirectory content
export const checkAllResourcesAreUnique = (builds: Builds): void => {
	const mapEntryAssetToSrc = (entryAsset: EntryAsset): string => entryAsset.src;
	const flattenBuildResources = (acc: string[], curr: string[]) => [...acc, ...curr];
	const allResources = [
		...builds.clientBuilds
			.map(clientBuild => [
				...(clientBuild.copyResources || []),
				...(clientBuild.styles || []),
				...clientBuild.scripts.map(mapEntryAssetToSrc),
				clientBuild.html,
			])
			.reduce(flattenBuildResources, []),
		...builds.regularBuilds
			.map(regularBuild => [...(regularBuild.copyResources || []), ...regularBuild.scripts.map(mapEntryAssetToSrc)])
			.reduce(flattenBuildResources, []),
	];
	const uniqueResources = new Set(allResources);
	if (uniqueResources.size !== allResources.length) {
		type DuplicateCount = { [k: string]: number };
		const countedResources = allResources.reduce<DuplicateCount>(
			(acc, curr) => ({
				...acc,
				[curr]: (acc[curr] || 0) + 1,
			}),
			{}
		);

		console.error('The following resources are duplicated:');
		const duplicates = Object.entries(countedResources).filter(([_, value]) => value > 1);
		duplicates.forEach(console.error);
		throw new Error('All resources must be unique!');
	}
};
