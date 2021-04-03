import esbuild from 'esbuild';
import { EntryAsset, EntryAssetTransformations } from '../build/build.model';

export type CommonEntryAsset = Omit<EntryAsset, 'buildProfiles'>;
export type CommonBuild = {
    buildProfile: EntryAssetTransformations;
    builds: CommonEntryAsset[];
};
export type BuildResult = {
    builds: CommonEntryAsset[];
    buildResult: esbuild.BuildResult;
};
