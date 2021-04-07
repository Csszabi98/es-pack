import type { BuildProfiles, BuildResult, Cleanup, DeterministicEntryAsset, EntryAsset } from './build.model';
export declare enum BuildLifecycles {
    BEFORE_RESOURCE_CHECK = "beforeResourceCheck",
    RESOURCE_CHECK = "onResourceCheck",
    AFTER_RESOURCE_CHECK = "afterResourceCheck",
    BEFORE_BUILD = "beforeBuild",
    BUILD = "onBuild",
    AFTER_BUILD = "afterBuild",
    WATCH = "onWatch",
    CLEANUP = "onCleanup"
}
declare type BuildLifecycleHooks = {
    [Key in BuildLifecycles]: unknown;
};
export interface BasePluginContext {
    scripts: EntryAsset[];
    defaultBuildProfiles: BuildProfiles | undefined;
}
export interface BuildReadyPluginContext extends BasePluginContext {
    buildReadyScripts: DeterministicEntryAsset[];
}
export interface BuiltPluginContext<T> extends BuildReadyPluginContext {
    buildResults: BuildResult[];
    pluginBuildResult: T;
}
export declare class EspackPlugin<T = unknown> implements BuildLifecycleHooks {
    protected readonly name: string;
    protected readonly hookInto: BuildLifecycles[];
    protected readonly errorPrefix: string;
    private notImplementedErrorFactory;
    constructor(name: string, hookInto: BuildLifecycles[]);
    hookEnabled(lifecycle: BuildLifecycles): boolean;
    beforeResourceCheck(context: BasePluginContext): void;
    onResourceCheck(context: BasePluginContext): Promise<void>;
    afterResourceCheck(context: BasePluginContext): void;
    beforeBuild(context: BuildReadyPluginContext): void;
    onBuild(context: BuildReadyPluginContext): Promise<T>;
    afterBuild(context: BuiltPluginContext<T>): void;
    onWatch(context: BuiltPluginContext<T>): Cleanup;
    onCleanup(context: BuiltPluginContext<T>): void;
    getName(): string;
}
export {};
