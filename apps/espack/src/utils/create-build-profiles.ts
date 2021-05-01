import { BuildProfiles, DefaultBuildProfiles, IEntryAssetTransformations } from '../build/build.model';
import deepCopy from 'deep-copy';

type CreateBuildProfiles = (
    commonOptions: Partial<IEntryAssetTransformations>,
    profileOverrides?: BuildProfiles,
    disableDefaultProfileExtension?: boolean
) => BuildProfiles;

const defaultProfiles: BuildProfiles = {
    [DefaultBuildProfiles.DEV]: {},
    [DefaultBuildProfiles.PROD]: {}
};

export const createBuildProfiles: CreateBuildProfiles = (
    commonOptions,
    profileOverrides,
    disableDefaultProfileExtension = false
) => {
    const options: Partial<IEntryAssetTransformations> = deepCopy(commonOptions);

    let profiles: BuildProfiles = disableDefaultProfileExtension ? {} : deepCopy(defaultProfiles);
    if (profileOverrides) {
        profiles = {
            ...profiles,
            ...profileOverrides
        };
    }

    Object.keys(profiles).forEach(profileName => {
        profiles[profileName] = {
            ...options,
            ...profiles[profileName]
        };
    });

    return profiles;
};
