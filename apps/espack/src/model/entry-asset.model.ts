import { BuildProfile, BuildProfiles } from './build-profile.model';

interface IEntryAssetWithBuildProfiles {
    src: string;
    buildProfiles?: BuildProfiles;
}

// The I prefix is preserved for compatibility reasons
export type IEntryAsset = IEntryAssetWithBuildProfiles | string;

export interface IDeterministicEntryAsset extends Omit<IEntryAssetWithBuildProfiles, 'buildProfiles'> {
    buildProfile: BuildProfile;
}
