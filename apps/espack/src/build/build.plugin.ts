import type { BuildProfiles, IBuildResult, ICleanup, IDeterministicEntryAsset, IEntryAsset } from './build.model';

export enum BuildLifecycles {
    BEFORE_RESOURCE_CHECK = 'beforeResourceCheck',
    RESOURCE_CHECK = 'onResourceCheck',
    AFTER_RESOURCE_CHECK = 'afterResourceCheck',
    BEFORE_BUILD = 'beforeBuild',
    BUILD = 'onBuild',
    AFTER_BUILD = 'afterBuild',
    WATCH = 'onWatch',
    CLEANUP = 'onCleanup'
}

type BuildLifecycleHooks = {
    [Key in BuildLifecycles]: unknown;
};

export interface IBasePluginContext {
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

export class EspackPlugin<T = unknown> implements BuildLifecycleHooks {
    protected readonly errorPrefix: string;
    protected readonly name: string;
    protected readonly hookInto: BuildLifecycles[];

    public constructor(name: string, hookInto: BuildLifecycles[]) {
        this.name = name;
        this.hookInto = hookInto;
        this.errorPrefix = `[Plugin ${this.name} error]:`;

        console.log(`Using plugin ${this.name}`);
    }

    private _notImplementedErrorFactory(lifecycle: BuildLifecycles): Error {
        return new Error(`${this.errorPrefix} ${lifecycle} is not implemented!`);
    }

    public hookEnabled(lifecycle: BuildLifecycles): boolean {
        return this.hookInto.includes(lifecycle);
    }

    public beforeResourceCheck(context: IBasePluginContext): void {
        throw this._notImplementedErrorFactory(BuildLifecycles.BEFORE_RESOURCE_CHECK);
    }

    public onResourceCheck(context: IBasePluginContext): Promise<void> {
        throw this._notImplementedErrorFactory(BuildLifecycles.RESOURCE_CHECK);
    }

    public afterResourceCheck(context: IBasePluginContext): void {
        throw this._notImplementedErrorFactory(BuildLifecycles.AFTER_RESOURCE_CHECK);
    }

    public beforeBuild(context: IBuildReadyPluginContext): void {
        throw this._notImplementedErrorFactory(BuildLifecycles.BEFORE_BUILD);
    }

    public onBuild(context: IBuildReadyPluginContext): Promise<T> {
        throw this._notImplementedErrorFactory(BuildLifecycles.BUILD);
    }

    public afterBuild(context: IBuiltPluginContext<T>): void {
        throw this._notImplementedErrorFactory(BuildLifecycles.AFTER_BUILD);
    }

    public onWatch(context: IBuiltPluginContext<T>): ICleanup {
        throw this._notImplementedErrorFactory(BuildLifecycles.WATCH);
    }

    public onCleanup(context: IBuiltPluginContext<T>): void {
        throw this._notImplementedErrorFactory(BuildLifecycles.CLEANUP);
    }

    public getName(): string {
        return this.name;
    }
}
