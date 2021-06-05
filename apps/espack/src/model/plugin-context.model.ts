import { IDeterministicEntryAsset, IEntryAsset } from './entry-asset.model';
import { BuildProfiles } from './build-profile.model';
import { IEspackBuildResult } from './build.model';

export interface IBasePluginContext {
    buildsDir: string;
    scripts: IEntryAsset[];
    defaultBuildProfiles: BuildProfiles;
    buildProfiles: BuildProfiles;
    buildProfile: string;
}

export interface IBuildReadyPluginContext extends IBasePluginContext {
    buildReadyScripts: IDeterministicEntryAsset[];
}

export interface IBuiltPluginContext<T> extends IBuildReadyPluginContext {
    buildResults: IEspackBuildResult[];
    pluginBuildResult: T;
}
