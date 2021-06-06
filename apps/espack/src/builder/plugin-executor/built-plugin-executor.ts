import { BuildResult } from 'esbuild';
import { BuildReadyPluginExecutor, IPluginBuildResult } from './build-ready-plugin-executor';
import {
    BuildLifecycles,
    DeterministicEspackMarkedPlugin,
    IBuiltPluginContext,
    ICleanup,
    IEspackBuildResult,
    IEspackMarkedPlugin
} from '../../model';
import { ExecuteLifecycleReturnType } from './plugin-executor';

export type BuiltPluginExecutorProps = Omit<IBuiltPluginContext<unknown>, 'pluginBuildResult'> & {
    pluginBuildResults: IPluginBuildResult[];
};

export class BuiltPluginExecutor extends BuildReadyPluginExecutor {
    protected buildResults: IEspackBuildResult[];
    protected pluginBuildResults: IPluginBuildResult[];

    public constructor(plugins: IEspackMarkedPlugin[], baseContext: BuiltPluginExecutorProps) {
        super(plugins, baseContext);
        this.buildResults = baseContext.buildResults;
        this.pluginBuildResults = baseContext.pluginBuildResults;
    }

    public updateEsbuildBuildResult(buildId: string, esbuildBuildResult: BuildResult): BuildResult | undefined {
        const espackBuildResult: IEspackBuildResult | undefined = this.buildResults.find(
            espackBuildResult => espackBuildResult.buildId === buildId
        );
        if (!espackBuildResult) {
            return;
        }

        const previousBuildResult: BuildResult = espackBuildResult.esbuildBuildResult;
        espackBuildResult.esbuildBuildResult = esbuildBuildResult;

        return previousBuildResult;
    }

    public executeLifecycle(
        lifecycle:
            | BuildLifecycles.BEFORE_RESOURCE_CHECK
            | BuildLifecycles.AFTER_RESOURCE_CHECK
            | BuildLifecycles.BEFORE_BUILD
            | BuildLifecycles.AFTER_BUILD
            | BuildLifecycles.AFTER_WRITE
            | BuildLifecycles.CLEANUP
    ): undefined;

    public executeLifecycle(lifecycle: BuildLifecycles.RESOURCE_CHECK): Promise<void>[];

    public executeLifecycle(lifecycle: BuildLifecycles.BUILD): Promise<IPluginBuildResult>[];

    public executeLifecycle(lifecycle: BuildLifecycles.WATCH): ICleanup[];

    public executeLifecycle(lifecycle: BuildLifecycles): ExecuteLifecycleReturnType {
        if (
            lifecycle !== BuildLifecycles.AFTER_BUILD &&
            lifecycle !== BuildLifecycles.AFTER_WRITE &&
            lifecycle !== BuildLifecycles.WATCH &&
            lifecycle !== BuildLifecycles.CLEANUP
        ) {
            return super.executeLifecycle(lifecycle);
        }
        const lifecyclePlugins: DeterministicEspackMarkedPlugin<typeof lifecycle>[] = this.getPluginsForLifecycle(lifecycle);

        const pluginCleanupPromises: (void | ICleanup)[] = lifecyclePlugins.map(plugin =>
            plugin[lifecycle]({
                ...this.baseContext,
                buildReadyScripts: this.buildReadyScripts,
                buildResults: this.buildResults,
                pluginBuildResult: this.pluginBuildResults.find(pluginBuildResult => pluginBuildResult.id === plugin.id)
                    ?.result
            })
        );

        if (lifecycle !== BuildLifecycles.WATCH) {
            return;
        }

        return pluginCleanupPromises as ICleanup[];
    }
}
