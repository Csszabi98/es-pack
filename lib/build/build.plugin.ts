import type { BuildProfiles, BuildResult, Cleanup, DeterministicEntryAsset, EntryAsset } from './build.model';

export enum BuildLifecycles {
    BEFORE_RESOURCE_CHECK = 'beforeResourceCheck',
    RESOURCE_CHECK = 'onResourceCheck',
    AFTER_RESOURCE_CHECK = 'afterResourceCheck',
    BEFORE_BUILD = 'beforeBuild',
    BUILD = 'onBuild',
    AFTER_BUILD = 'afterBuild',
    WATCH = 'onWatch',
    CLEANUP = 'onCleanup',
}

type BuildLifecycleHooks = {
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

export class EspackPlugin<T = unknown> implements BuildLifecycleHooks {
    protected readonly errorPrefix;

    private notImplementedErrorFactory(lifecycle: BuildLifecycles): Error {
        return new Error(`${this.errorPrefix} ${lifecycle} is not implemented!`);
    }

    constructor(protected readonly name: string, protected readonly hookInto: BuildLifecycles[]) {
        console.log(`Using plugin ${this.name}`);
        this.errorPrefix = `[Plugin ${this.name} error]:`;
    }

    public hookEnabled(lifecycle: BuildLifecycles): boolean {
        return this.hookInto.includes(lifecycle);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public beforeResourceCheck(context: BasePluginContext): void {
        throw this.notImplementedErrorFactory(BuildLifecycles.BEFORE_RESOURCE_CHECK);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onResourceCheck(context: BasePluginContext): Promise<void> {
        throw this.notImplementedErrorFactory(BuildLifecycles.RESOURCE_CHECK);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public afterResourceCheck(context: BasePluginContext): void {
        throw this.notImplementedErrorFactory(BuildLifecycles.AFTER_RESOURCE_CHECK);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public beforeBuild(context: BuildReadyPluginContext): void {
        throw this.notImplementedErrorFactory(BuildLifecycles.BEFORE_BUILD);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onBuild(context: BuildReadyPluginContext): Promise<T> {
        throw this.notImplementedErrorFactory(BuildLifecycles.BUILD);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public afterBuild(context: BuiltPluginContext<T>): void {
        throw this.notImplementedErrorFactory(BuildLifecycles.AFTER_BUILD);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onWatch(context: BuiltPluginContext<T>): Cleanup {
        throw this.notImplementedErrorFactory(BuildLifecycles.WATCH);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onCleanup(context: BuiltPluginContext<T>): void {
        throw this.notImplementedErrorFactory(BuildLifecycles.CLEANUP);
    }

    public getName(): string {
        return this.name;
    }
}
