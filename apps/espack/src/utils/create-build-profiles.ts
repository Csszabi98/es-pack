import { BuildProfiles, DefaultBuildProfiles, IEntryAssetTransformations } from 'src/build/build.model';
import v8 from 'v8';

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
    const options: Partial<IEntryAssetTransformations> = v8.deserialize(v8.serialize(commonOptions));

    let profiles: BuildProfiles = disableDefaultProfileExtension ? {} : v8.deserialize(v8.serialize(defaultProfiles));
    if (profileOverrides) {
        profiles = {
            ...profiles,
            ...v8.deserialize(v8.serialize(profileOverrides))
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
