import {
    BuildLifecycles,
    DeterministicEspackMarkedPlugin,
    IBasePluginContext,
    ICleanup,
    IEspackMarkedPlugin,
    IPluginHooks
} from '../../model';

export type ResourceCheckLifecycles =
    | BuildLifecycles.BEFORE_RESOURCE_CHECK
    | BuildLifecycles.RESOURCE_CHECK
    | BuildLifecycles.AFTER_RESOURCE_CHECK;

export type ExecuteLifecycleReturnType = Promise<void>[] | Promise<unknown>[] | ICleanup[] | undefined;

export class PluginExecutor {
    protected readonly plugins: IEspackMarkedPlugin[];
    protected readonly baseContext: IBasePluginContext;

    public constructor(plugins: IEspackMarkedPlugin[], baseContext: IBasePluginContext) {
        this.plugins = plugins;
        this.baseContext = baseContext;
    }

    protected getPluginsForLifecycle = <T extends keyof IPluginHooks>(lifecycle: T): DeterministicEspackMarkedPlugin<T>[] =>
        (this.plugins.filter(plugin => plugin[lifecycle]) as unknown) as DeterministicEspackMarkedPlugin<T>[];

    public executeLifecycle(
        lifecycle: BuildLifecycles.BEFORE_RESOURCE_CHECK | BuildLifecycles.AFTER_RESOURCE_CHECK
    ): undefined;

    public executeLifecycle(lifecycle: BuildLifecycles.RESOURCE_CHECK): Promise<void>[];

    public executeLifecycle(lifecycle: ResourceCheckLifecycles): ExecuteLifecycleReturnType;

    public executeLifecycle(lifecycle: ResourceCheckLifecycles): ExecuteLifecycleReturnType {
        const lifecyclePlugins: DeterministicEspackMarkedPlugin<typeof lifecycle>[] = this.getPluginsForLifecycle(lifecycle);
        if (lifecycle === BuildLifecycles.BEFORE_RESOURCE_CHECK || lifecycle === BuildLifecycles.AFTER_RESOURCE_CHECK) {
            lifecyclePlugins.forEach(plugin => plugin[lifecycle](this.baseContext));
            return;
        }
        return lifecyclePlugins.map(plugin => plugin[lifecycle](this.baseContext));
    }
}
