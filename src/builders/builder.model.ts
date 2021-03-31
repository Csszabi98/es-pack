import { EntryAsset, EntryAssetTransformations } from '../build.model';
import esbuild from 'esbuild';

export type CommonEntryAsset = Omit<EntryAsset, 'buildProfiles'>;
export type CommonBuild = {
	buildProfile: EntryAssetTransformations;
	builds: CommonEntryAsset[];
};
export type BuildResult = {
	builds: CommonEntryAsset[];
	buildResult: esbuild.BuildResult;
};
