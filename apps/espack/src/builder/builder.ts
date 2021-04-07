import {
    IBasePluginContext,
    BuildLifecycles,
    IBuildReadyPluginContext,
    IBuiltPluginContext,
    EspackPlugin
} from '../build/build.plugin';
import { getPluginsForLifecycle } from '../utils/get-plugins-for-lifecycle';
import { ICleanup, IBuild, BuildProfiles } from '../build/build.model';
import { createBuildReadyScripts, executeBuilds } from './builder.helpers';
import { checkScripts } from './builder.utils';

export const builder = async (
    defaultBuildProfiles: BuildProfiles | undefined,
    defaultPlugins: EspackPlugin[] | undefined,
    { scripts, buildProfiles, plugins }: IBuild,
    watch: boolean,
    buildProfile: string | undefined,
    singleBuildMode: boolean
): Promise<ICleanup> => {
    const allPlugins = [...(defaultPlugins || []), ...(plugins || [])];

    const basePluginContext: IBasePluginContext = {
        scripts,
        defaultBuildProfiles
    };
    // Before check resources
    const beforeResourceCheckPlugins = getPluginsForLifecycle(allPlugins, BuildLifecycles.BEFORE_RESOURCE_CHECK);
    beforeResourceCheckPlugins.forEach(plugin => plugin.beforeResourceCheck(basePluginContext));

    // Check resources
    const onResourceCheckPlugins = getPluginsForLifecycle(allPlugins, BuildLifecycles.RESOURCE_CHECK);
    const pluginResourceChecks = onResourceCheckPlugins.map(plugin => plugin.onResourceCheck(basePluginContext));
    const resourceChecks = [checkScripts(scripts), ...pluginResourceChecks];

    const checkResults = await Promise.allSettled(resourceChecks);

    if (checkResults.some(assetCheck => assetCheck.status === 'rejected')) {
        throw new Error('Failed to load some assets!');
    }

    // After check resources
    const afterResourceCheckPlugins = getPluginsForLifecycle(allPlugins, BuildLifecycles.AFTER_RESOURCE_CHECK);
    afterResourceCheckPlugins.forEach(plugin => plugin.afterResourceCheck(basePluginContext));

    // Before build
    const buildReadyScripts = createBuildReadyScripts(
        scripts,
        buildProfile,
        defaultBuildProfiles,
        buildProfiles,
        watch,
        singleBuildMode
    );
    const buildReadyPluginContext: IBuildReadyPluginContext = { ...basePluginContext, buildReadyScripts };

    const beforeBuildPlugins = getPluginsForLifecycle(allPlugins, BuildLifecycles.BEFORE_BUILD);
    beforeBuildPlugins.forEach(plugin => plugin.beforeBuild(buildReadyPluginContext));

    // Build, inject info from build
    const onBuildPlugins = getPluginsForLifecycle(allPlugins, BuildLifecycles.BUILD);
    const buildPlugins = onBuildPlugins.map(plugin => plugin.onBuild(buildReadyPluginContext));

    const [buildResults, pluginBuildResults] = await Promise.all([
        executeBuilds(buildReadyScripts),
        Promise.all(buildPlugins)
    ]);
    const builtPluginContexts: IBuiltPluginContext<unknown>[] = pluginBuildResults.map(pluginBuildResult => ({
        ...buildReadyPluginContext,
        buildResults,
        pluginBuildResult
    }));

    // After build
    const afterBuildPlugins = getPluginsForLifecycle(allPlugins, BuildLifecycles.AFTER_BUILD);
    afterBuildPlugins.forEach((plugin, index) => plugin.afterBuild(builtPluginContexts[index]));

    let pluginWatchCleanups: ICleanup[] | undefined;
    if (watch) {
        // On watch
        const onWatchPlugins = getPluginsForLifecycle(allPlugins, BuildLifecycles.WATCH);
        pluginWatchCleanups = onWatchPlugins.map((plugin, index) => plugin.onWatch(builtPluginContexts[index]));
    }

    return {
        stop: () => {
            // Cleanup
            buildResults.forEach(build => build.buildResult.stop && build.buildResult.stop());

            const onCleanupPlugins = getPluginsForLifecycle(allPlugins, BuildLifecycles.AFTER_BUILD);
            onCleanupPlugins.forEach((plugin, index) => plugin.onCleanup(builtPluginContexts[index]));

            if (pluginWatchCleanups) {
                pluginWatchCleanups.forEach(watchJob => watchJob.stop());
            }
        }
    };
};
