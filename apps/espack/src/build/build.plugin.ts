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

export interface IBasePluginContext {
    buildsDir: string;
    scripts: IEntryAsset[];
    defaultBuildProfiles: BuildProfiles | undefined;
}

export interface IBuildReadyPluginContext extends IBasePluginContext {
    buildReadyScripts: IDeterministicEntryAsset[];
}

export interface IBuiltPluginContext<T> extends IBuildReadyPluginContext {
    buildResults: IBuildResult[];
    pluginBuildResult: T;
}

export interface IEspackPlugin<T = unknown> {
    readonly name: string;
    [BuildLifecycles.BEFORE_RESOURCE_CHECK]?: (context: IBasePluginContext) => void;
    [BuildLifecycles.RESOURCE_CHECK]?: (context: IBasePluginContext) => Promise<void>;
    [BuildLifecycles.AFTER_RESOURCE_CHECK]?: (context: IBasePluginContext) => void;
    [BuildLifecycles.BEFORE_BUILD]?: (context: IBuildReadyPluginContext) => void;
    [BuildLifecycles.BUILD]?: (context: IBuildReadyPluginContext) => Promise<T>;
    [BuildLifecycles.AFTER_BUILD]?: (context: IBuiltPluginContext<T>) => void;
    [BuildLifecycles.AFTER_WRITE]?: (context: IBuiltPluginContext<T>) => void;
    [BuildLifecycles.WATCH]?: (context: IBuiltPluginContext<T>) => ICleanup;
    [BuildLifecycles.CLEANUP]?: (context: IBuiltPluginContext<T>) => void;
    [key: string]: unknown;
}

type RequiredField<T, Field extends keyof T> = {
    [P in keyof Pick<T, Field>]-?: NonNullable<T[P]>;
};

export type DeterministicEspackPlugin<Key extends keyof IEspackPlugin<T>, T = unknown> = RequiredField<
    IEspackPlugin<T>,
    Key
> &
    Omit<IEspackPlugin<T>, Key>;
