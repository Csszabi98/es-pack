import path from 'path';
import {
    DEFAULT_ENTRY_ASSET_TRANSFORMATIONS,
    ENTRY_POINT_NOT_EXISTS_ERROR_MESSAGE,
    NON_EXISTENT_ENTRY_POINTS_ANNOUNCEMENT_MESSAGE,
} from '../build/build.constants';
import {
    EntryAsset,
    DefaultBuildProfiles,
    BuildProfiles,
    DeterministicEntryAsset,
    StringToDefaultBuildProfiles,
    Profiles,
    IncompleteProfiles,
} from '../build/build.model';
import { checkAssetsExist } from '../utils/check-assets-exist';
import { isFile, FileExtensions } from '../utils/is-file';

const mapEnvironmentVariables = (environmentVariables: Record<string, string>): Record<string, string> =>
    Object.entries(environmentVariables).reduce(
        (acc, [key, value]) => ({
            // TODO: Warning | Error for duplicate keys
            ...acc,
            [`process.env.${key}`]: `"${value}"`,
        }),
        {}
    );

const getGlobalBuildProfile = (buildProfileName: DefaultBuildProfiles, watch: boolean): Profiles => {
    const { buildsDir, excludePeerDependencies, ...buildProfile } = DEFAULT_ENTRY_ASSET_TRANSFORMATIONS[buildProfileName];
    return {
        espackBuildProfile: {
            excludePeerDependencies,
            buildsDir,
        },
        buildProfile: {
            ...buildProfile,
            outdir: buildsDir,
            watch,
        },
    };
};

const extractPartialBuildProfile = (
    buildProfiles: BuildProfiles | undefined,
    buildProfileName: string
): IncompleteProfiles | undefined => {
    if (!buildProfiles) {
        return;
    }
    const commonBuildProfile = buildProfiles[buildProfileName];
    if (!commonBuildProfile) {
        return;
    }

    const { excludePeerDependencies, ...buildProfile } = commonBuildProfile;
    return {
        // Separate espack and esbuild options
        espackBuildProfile: {
            excludePeerDependencies,
        },
        buildProfile,
    };
};

interface CreateBuildableScriptProps {
    script: EntryAsset;
    watch: boolean;
    peerDependencies: string[];
    numberOfBuilds: number;
    currentBuildIndex: number;
    buildProfile?: string;
    defaultBuildProfiles?: BuildProfiles;
    buildProfiles?: BuildProfiles;
}

export const createBuildableScript = ({
    script,
    watch,
    peerDependencies,
    numberOfBuilds,
    currentBuildIndex,
    buildProfile = DefaultBuildProfiles.PROD,
    defaultBuildProfiles,
    buildProfiles,
}: CreateBuildableScriptProps): DeterministicEntryAsset => {
    const defaultBuildProfile = StringToDefaultBuildProfiles[buildProfile] || DefaultBuildProfiles.PROD;
    const { src, buildProfiles: scriptBuildProfiles } = script;
    const globalOptions = getGlobalBuildProfile(defaultBuildProfile, watch);
    const defaultOptions = extractPartialBuildProfile(defaultBuildProfiles, buildProfile);
    const buildOptions = extractPartialBuildProfile(buildProfiles, buildProfile);
    const scriptOptions = extractPartialBuildProfile(scriptBuildProfiles, buildProfile);

    if (defaultOptions || buildOptions || scriptOptions) {
        const result: DeterministicEntryAsset = {
            src,
            espackBuildProfile: {
                ...globalOptions.espackBuildProfile,
                ...defaultOptions?.espackBuildProfile,
                ...buildOptions?.espackBuildProfile,
                ...scriptOptions?.espackBuildProfile,
            },
            buildProfile: {
                ...globalOptions.buildProfile,
                ...defaultOptions?.buildProfile,
                ...buildOptions?.buildProfile,
                ...scriptOptions?.buildProfile,
                watch,
            },
        };
        const external = result.espackBuildProfile.excludePeerDependencies
            ? [...result.buildProfile.external, ...peerDependencies]
            : result.buildProfile.external;
        result.buildProfile.external = external;

        if (!external.length && result.espackBuildProfile.excludePeerDependencies) {
            console.warn('There are no peer dependencies to exlude!');
        } else {
            console.log('Excluding the following dependencies:');
            external.forEach(console.log);
        }

        result.buildProfile.define = mapEnvironmentVariables(result.buildProfile.define);

        if (numberOfBuilds > 1 && result.buildProfile.outdir === result.espackBuildProfile.buildsDir) {
            const outdir = path.join(result.espackBuildProfile.buildsDir, `build_${currentBuildIndex}`);
            result.buildProfile.outdir = outdir;
        }

        return result;
    }
    return {
        src,
        ...globalOptions,
    };
};

export const checkScripts = (entries: EntryAsset[]): Promise<void> => {
    const allowedEntryPointExtensions = [
        FileExtensions.JAVASCRIPT,
        FileExtensions.TYPESCRIPT,
        FileExtensions.JSX,
        FileExtensions.TSX,
    ];
    const nonEntryPoints = entries.filter(entryPoint => !isFile(entryPoint.src, ...allowedEntryPointExtensions));
    if (nonEntryPoints.length) {
        console.error('Some of your provided entry points have incorrect extensions:');
        nonEntryPoints.forEach(console.log);
        throw new Error('An entry point must have either one of the following file extensions: .js .jsx .ts .tsx');
    }
    return checkAssetsExist(
        entries.map(entry => entry.src),
        ENTRY_POINT_NOT_EXISTS_ERROR_MESSAGE,
        NON_EXISTENT_ENTRY_POINTS_ANNOUNCEMENT_MESSAGE
    );
};