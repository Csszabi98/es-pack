import {
    BuildProfile,
    BuildProfiles,
    DefaultBuildProfiles,
    IDeterministicEntryAsset,
    IEntryAsset,
    StringToDefaultBuildProfiles
} from '../model';
import { DEFAULT_ENTRY_ASSET_TRANSFORMATIONS } from '../constants/build-profile.constants';

interface IProfileBuilderProps {
    scripts: IEntryAsset[];
    buildProfile: string;
    defaultBuildProfiles: BuildProfiles;
    buildProfiles: BuildProfiles;
    watch: boolean;
    singleBuildMode: boolean;
}

export class ProfileBuilder {
    private readonly _scripts: IEntryAsset[];
    private readonly _buildProfile: string;
    private readonly _defaultBuildProfiles: BuildProfiles;
    private readonly _buildProfiles: BuildProfiles;
    private readonly _watch: boolean;
    private readonly _singleBuildMode: boolean;

    public constructor({
        scripts,
        buildProfile,
        defaultBuildProfiles,
        buildProfiles,
        singleBuildMode,
        watch
    }: IProfileBuilderProps) {
        this._scripts = scripts;
        this._buildProfile = buildProfile;
        this._defaultBuildProfiles = defaultBuildProfiles;
        this._buildProfiles = buildProfiles;
        this._singleBuildMode = singleBuildMode;
        this._watch = watch;
    }

    private static _mapEnvironmentVariables(environmentVariables: Record<string, string>): Record<string, string> {
        return Object.entries(environmentVariables).reduce(
            (acc, [key, value]) => ({
                // TODO: Warning | Error for duplicate keys
                ...acc,
                [key]: `"${value}"`
            }),
            {}
        );
    }

    private static _extractPartialBuildProfile(
        buildProfiles: BuildProfiles,
        buildProfileName: string
    ): Partial<BuildProfile> | undefined {
        const buildProfile: Partial<BuildProfile> | undefined = buildProfiles[buildProfileName];
        if (!buildProfile) {
            return;
        }

        return buildProfile;
    }

    private _buildScriptProfile(script: IEntryAsset, currentBuildIndex: number): IDeterministicEntryAsset {
        const defaultBuildProfile: DefaultBuildProfiles =
            StringToDefaultBuildProfiles[this._buildProfile] || DefaultBuildProfiles.PROD;

        let src: string;
        let scriptBuildProfiles: BuildProfiles | undefined;
        if (typeof script === 'string') {
            src = script;
        } else {
            ({ src, buildProfiles: scriptBuildProfiles } = script);
        }
        const globalOptions: BuildProfile = DEFAULT_ENTRY_ASSET_TRANSFORMATIONS[defaultBuildProfile];
        const defaultOptions: Partial<BuildProfile> | undefined = ProfileBuilder._extractPartialBuildProfile(
            this._defaultBuildProfiles,
            this._buildProfile
        );
        const buildOptions: Partial<BuildProfile> | undefined = ProfileBuilder._extractPartialBuildProfile(
            this._buildProfiles,
            this._buildProfile
        );
        const scriptOptions: Partial<BuildProfile> | undefined =
            scriptBuildProfiles && ProfileBuilder._extractPartialBuildProfile(scriptBuildProfiles, this._buildProfile);

        if (defaultOptions || buildOptions || scriptOptions) {
            const result: IDeterministicEntryAsset = {
                src,
                buildProfile: {
                    ...globalOptions,
                    ...defaultOptions,
                    ...buildOptions,
                    ...scriptOptions
                }
            };

            result.buildProfile.define = ProfileBuilder._mapEnvironmentVariables(result.buildProfile.define);

            const { outdir } = result.buildProfile;
            if (!this._singleBuildMode && outdir === '') {
                result.buildProfile.outdir = `build_${currentBuildIndex}`;
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
            buildProfile: globalOptions
        };
    }

    public build(): IDeterministicEntryAsset[] {
        const buildReadyScripts: IDeterministicEntryAsset[] = this._scripts.map(this._buildScriptProfile.bind(this));

        if (buildReadyScripts.length) {
            console.log('Building scripts with the following profiles:');
            buildReadyScripts.forEach(build => console.log(build));
        }

        return buildReadyScripts;
    }
}
