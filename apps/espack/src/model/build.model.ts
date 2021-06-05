import { BuildResult } from 'esbuild';
import { BuildProfile, BuildProfiles } from './build-profile.model';
import { IEntryAsset } from './entry-asset.model';
import { IEspackPlugin } from './plugin.model';

export interface IEspackBuild {
    buildProfiles?: BuildProfiles;
    // eslint-disable-next-line
    plugins?: IEspackPlugin<any>[];
    scripts: IEntryAsset[];
}

export interface ICommonEspackBuild {
    buildProfile: BuildProfile;
    builds: string[];
}
export interface IEspackBuildResult {
    buildId: string;
    build: ICommonEspackBuild;
    esbuildBuildResult: BuildResult;
}

export interface IEspackBuilds {
    buildsDir?: string;
    defaultBuildProfiles?: BuildProfiles;
    builds: IEspackBuild[];
}
