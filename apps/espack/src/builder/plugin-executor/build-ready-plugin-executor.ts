import { ExecuteLifecycleReturnType, PluginExecutor, ResourceCheckLifecycles } from './plugin-executor';
import {
    BuildLifecycles,
    DeterministicEspackMarkedPlugin,
    IBuildReadyPluginContext,
    IDeterministicEntryAsset,
    IEspackMarkedPlugin
} from '../../model';

export type BuildReadyLifecycles = BuildLifecycles.BUILD | BuildLifecycles.BEFORE_BUILD;
export interface IPluginBuildResult {
    id: symbol;
    result: unknown;
}

export class BuildReadyPluginExecutor extends PluginExecutor {
    protected buildReadyScripts: IDeterministicEntryAsset[];

    public constructor(plugins: IEspackMarkedPlugin[], baseContext: IBuildReadyPluginContext) {
        super(plugins, baseContext);
        this.buildReadyScripts = baseContext.buildReadyScripts;
    }

    public executeLifecycle(
        lifecycle:
            | BuildLifecycles.BEFORE_RESOURCE_CHECK
            | BuildLifecycles.AFTER_RESOURCE_CHECK
            | BuildLifecycles.BEFORE_BUILD
    ): undefined;

    public executeLifecycle(lifecycle: BuildLifecycles.RESOURCE_CHECK): Promise<void>[];

    public executeLifecycle(lifecycle: BuildLifecycles.BUILD): Promise<IPluginBuildResult>[];

    public executeLifecycle(lifecycle: ResourceCheckLifecycles | BuildReadyLifecycles): ExecuteLifecycleReturnType;

    public executeLifecycle(lifecycle: ResourceCheckLifecycles | BuildReadyLifecycles): ExecuteLifecycleReturnType {
        if (lifecycle !== BuildLifecycles.BUILD && lifecycle !== BuildLifecycles.BEFORE_BUILD) {
            return super.executeLifecycle(lifecycle);
        }
        const lifecyclePlugins: DeterministicEspackMarkedPlugin<typeof lifecycle>[] = this.getPluginsForLifecycle(lifecycle);
        const buildReadyPluginContext: IBuildReadyPluginContext = {
            ...this.baseContext,
            buildReadyScripts: this.buildReadyScripts
        };

        if (lifecycle === BuildLifecycles.BEFORE_BUILD) {
            lifecyclePlugins.forEach(plugin => plugin[lifecycle](buildReadyPluginContext));
            return;
        }

        return lifecyclePlugins.map(async plugin => ({
            id: plugin.id,
            result: await plugin[lifecycle](buildReadyPluginContext)
        }));
    }
}
