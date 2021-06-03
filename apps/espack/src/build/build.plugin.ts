import type { BuildProfiles, IBuildResult, ICleanup, IDeterministicEntryAsset, IEntryAsset } from './build.model';

export enum BuildLifecycles {
    BEFORE_RESOURCE_CHECK = 'beforeResourceCheck',
    RESOURCE_CHECK = 'onResourceCheck',
    AFTER_RESOURCE_CHECK = 'afterResourceCheck',
    BEFORE_BUILD = 'beforeBuild',
    BUILD = 'onBuild',
    AFTER_BUILD = 'afterBuild',
    AFTER_WRITE = 'afterWrite',
    WATCH = 'registerCustomWatcher',
    CLEANUP = 'onCleanup'
}

export interface IPluginHooks<T = unknown> {
    [BuildLifecycles.BEFORE_RESOURCE_CHECK]?: (context: IBasePluginContext) => void;
    [BuildLifecycles.RESOURCE_CHECK]?: (context: IBasePluginContext) => Promise<void>;
    [BuildLifecycles.AFTER_RESOURCE_CHECK]?: (context: IBasePluginContext) => void;
    [BuildLifecycles.BEFORE_BUILD]?: (context: IBuildReadyPluginContext) => void;
    [BuildLifecycles.BUILD]?: (context: IBuildReadyPluginContext) => Promise<T>;
    [BuildLifecycles.AFTER_BUILD]?: (context: IBuiltPluginContext<T>) => void;
    [BuildLifecycles.AFTER_WRITE]?: (context: IBuiltPluginContext<T>) => void;
    [BuildLifecycles.WATCH]?: (context: IBuiltPluginContext<T>) => ICleanup;
    [BuildLifecycles.CLEANUP]?: (context: IBuiltPluginContext<T>) => void;
}

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
    buildResults: IBuildResult[];
    pluginBuildResult: T;
}

export interface IEspackPlugin<T = unknown> extends IPluginHooks<T> {
    readonly name: string;
}

export interface IEspackMarkedPlugin<T = unknown> extends IEspackPlugin<T> {
    id: symbol;
}

type RequiredField<T, Field extends keyof T> = {
    [P in keyof Pick<T, Field>]-?: NonNullable<T[P]>;
};

export type DeterministicEspackMarkedPlugin<Key extends keyof IPluginHooks<T>, T = unknown> = RequiredField<
    IEspackMarkedPlugin<T>,
    Key
> &
    Omit<IEspackMarkedPlugin<T>, Key>;
