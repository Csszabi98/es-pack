import deepCopy from 'deep-copy';
import { BuildProfile, BuildProfiles, DefaultBuildProfiles } from '../model';

type CreateBuildProfiles = (
    commonOptions: Partial<BuildProfile>,
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
    const options: Partial<BuildProfile> = deepCopy(commonOptions);

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
