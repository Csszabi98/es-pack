import fs from 'fs';
import {
    ENTRY_POINT_NOT_EXISTS_ERROR_MESSAGE,
    NON_EXISTENT_ENTRY_POINTS_ANNOUNCEMENT_MESSAGE,
    BUILD_ENCODING,
} from '../build/build.constants';
import { Cleanup } from '../build/build.model';
import { checkAssetsExist } from './check-assets-exist';
import { getOutputAsset } from './asset.utils';

export const checkResources = (resources: string[]): Promise<void> =>
    checkAssetsExist(resources, ENTRY_POINT_NOT_EXISTS_ERROR_MESSAGE, NON_EXISTENT_ENTRY_POINTS_ANNOUNCEMENT_MESSAGE);

export type WatchedResource = {
    src: string;
    onRebuild?: (fileName: string) => void;
};

export const watchResources = (resources: WatchedResource[], outdir: string): Promise<Cleanup> =>
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
                    fs.copyFileSync(fileName, getOutputAsset(fileName, outdir));
                }
            });
            return watcher;
        });
        const close = (): void => {
            watchers.forEach(watcher => watcher.close());
        };
        resolve({ stop: close });
    });
