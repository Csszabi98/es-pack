import fs from 'fs';
import path from 'path';
import { getAssetFileName } from './get-asset-filename';

export const getOutputAsset = (asset: string, outdir: string): string => path.join(outdir, getAssetFileName(asset));

export const copyAssets = async (assets: string[], outdir: string): Promise<void> => {
    const copyJobs = assets.map(asset => fs.promises.copyFile(asset, getOutputAsset(asset, outdir)));
    await Promise.all(copyJobs);
};
