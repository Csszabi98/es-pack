import path from 'path';
import {
    DEFAULT_ENTRY_ASSET_TRANSFORMATIONS,
    ENTRY_POINT_NOT_EXISTS_ERROR_MESSAGE,
    NON_EXISTENT_ENTRY_POINTS_ANNOUNCEMENT_MESSAGE
} from '../build/build.constants';
import {
    IEntryAsset,
    DefaultBuildProfiles,
    BuildProfiles,
    IDeterministicEntryAsset,
    StringToDefaultBuildProfiles,
    IProfiles,
    IIncompleteProfiles,
    IEntryAssetTransformations
} from '../build/build.model';
import { checkAssetsExist, isFile, FileExtensions } from '../utils';

const mapEnvironmentVariables = (environmentVariables: Record<string, string>): Record<string, string> =>
    Object.entries(environmentVariables).reduce(
        (acc, [key, value]) => ({
            // TODO: Warning | Error for duplicate keys
            ...acc,
            [key]: `"${value}"`
        }),
        {}
    );

const getGlobalBuildProfile = (buildProfileName: DefaultBuildProfiles, buildsDir: string): IProfiles => {
    return {
        buildProfile: {
            ...DEFAULT_ENTRY_ASSET_TRANSFORMATIONS[buildProfileName],
            outdir: buildsDir
        }
    };
};

const extractPartialBuildProfile = (
    buildProfiles: BuildProfiles | undefined,
    buildProfileName: string
): IIncompleteProfiles | undefined => {
    if (!buildProfiles) {
        return;
    }
    const buildProfile: Partial<IEntryAssetTransformations> | undefined = buildProfiles[buildProfileName];
    if (!buildProfile) {
        return;
    }

    return { buildProfile };
};

interface ICreateBuildableScriptProps {
    script: IEntryAsset;
    buildsDir: string;
    watch: boolean;
    singleBuildMode: boolean;
    currentBuildIndex: number;
    buildProfile?: string;
    defaultBuildProfiles?: BuildProfiles;
    buildProfiles?: BuildProfiles;
}

export const createBuildableScript = ({
    script,
    buildsDir,
    singleBuildMode,
    currentBuildIndex,
    buildProfile = DefaultBuildProfiles.PROD,
    defaultBuildProfiles,
    buildProfiles
}: ICreateBuildableScriptProps): IDeterministicEntryAsset => {
    const defaultBuildProfile: DefaultBuildProfiles =
        StringToDefaultBuildProfiles[buildProfile] || DefaultBuildProfiles.PROD;
    const { src, buildProfiles: scriptBuildProfiles } = script;
    const globalOptions: IProfiles = getGlobalBuildProfile(defaultBuildProfile, buildsDir);
    const defaultOptions: IIncompleteProfiles | undefined = extractPartialBuildProfile(defaultBuildProfiles, buildProfile);
    const buildOptions: IIncompleteProfiles | undefined = extractPartialBuildProfile(buildProfiles, buildProfile);
    const scriptOptions: IIncompleteProfiles | undefined = extractPartialBuildProfile(scriptBuildProfiles, buildProfile);

    if (defaultOptions || buildOptions || scriptOptions) {
        const result: IDeterministicEntryAsset = {
            src,
            buildProfile: {
                ...globalOptions.buildProfile,
                ...defaultOptions?.buildProfile,
                ...buildOptions?.buildProfile,
                ...scriptOptions?.buildProfile
            }
        };

        result.buildProfile.define = mapEnvironmentVariables(result.buildProfile.define);

        const { outdir } = result.buildProfile;
        if (!singleBuildMode && outdir === buildsDir) {
            result.buildProfile.outdir = path.join(buildsDir, `build_${currentBuildIndex}`);
        } else if (outdir !== buildsDir) {
            result.buildProfile.outdir = path.join(buildsDir, outdir);
        }

        if (!result.buildProfile.minify) {
            result.buildProfile.minifyIdentifiers = false;
            result.buildProfile.minifySyntax = false;
            result.buildProfile.minifyWhitespace = false;
        }

        return result;
    }
    return {
        src,
        ...globalOptions
    };
};

export const checkScripts = (entries: IEntryAsset[]): Promise<void> => {
    const allowedEntryPointExtensions: FileExtensions[] = [
        FileExtensions.JAVASCRIPT,
        FileExtensions.TYPESCRIPT,
        FileExtensions.JSX,
        FileExtensions.TSX
    ];
    const nonEntryPoints: IEntryAsset[] = entries.filter(
        entryPoint => !isFile(entryPoint.src, ...allowedEntryPointExtensions)
    );
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
