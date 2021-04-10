import {
    IBasePluginContext,
    BuildLifecycles,
    IBuildReadyPluginContext,
    IBuiltPluginContext,
    EspackPlugin
} from '../build/build.plugin';
import { getPluginsForLifecycle } from '../utils/get-plugins-for-lifecycle';
import { ICleanup, IBuild, BuildProfiles, IDeterministicEntryAsset, IBuildResult } from '../build/build.model';
import { createBuildReadyScripts, executeBuilds, Watcher } from './builder.helpers';
import { checkScripts } from './builder.utils';
import { BuildFailure, BuildResult } from 'esbuild';

export const builder = async (
    defaultBuildProfiles: BuildProfiles | undefined,
    defaultPlugins: EspackPlugin[] | undefined,
    { scripts, buildProfiles, plugins }: IBuild,
    watch: boolean,
    buildProfile: string | undefined,
    singleBuildMode: boolean
): Promise<ICleanup> => {
    const allPlugins: EspackPlugin[] = [...(defaultPlugins || []), ...(plugins || [])];

    const basePluginContext: IBasePluginContext = {
        scripts,
        defaultBuildProfiles
    };
    // Before check resources
    const beforeResourceCheckPlugins: EspackPlugin[] = getPluginsForLifecycle(
        allPlugins,
        BuildLifecycles.BEFORE_RESOURCE_CHECK
    );
    beforeResourceCheckPlugins.forEach(plugin => plugin.beforeResourceCheck(basePluginContext));

    // Check resources
    const onResourceCheckPlugins: EspackPlugin[] = getPluginsForLifecycle(allPlugins, BuildLifecycles.RESOURCE_CHECK);
    const pluginResourceChecks: Promise<void>[] = onResourceCheckPlugins.map(plugin =>
        plugin.onResourceCheck(basePluginContext)
    );
    const resourceChecks: Promise<void>[] = [checkScripts(scripts), ...pluginResourceChecks];

    const checkResults: PromiseSettledResult<void>[] = await Promise.allSettled(resourceChecks);

    if (checkResults.some(assetCheck => assetCheck.status === 'rejected')) {
        throw new Error('Failed to load some assets!');
    }

    // After check resources
    const afterResourceCheckPlugins: EspackPlugin[] = getPluginsForLifecycle(
        allPlugins,
        BuildLifecycles.AFTER_RESOURCE_CHECK
    );
    afterResourceCheckPlugins.forEach(plugin => plugin.afterResourceCheck(basePluginContext));

    // Before build
    const buildReadyScripts: IDeterministicEntryAsset[] = createBuildReadyScripts(
        scripts,
        buildProfile,
        defaultBuildProfiles,
        buildProfiles,
        watch,
        singleBuildMode
    );
    const buildReadyPluginContext: IBuildReadyPluginContext = {
        ...basePluginContext,
        buildReadyScripts
    };

    const beforeBuildPlugins: EspackPlugin[] = getPluginsForLifecycle(allPlugins, BuildLifecycles.BEFORE_BUILD);
    beforeBuildPlugins.forEach(plugin => plugin.beforeBuild(buildReadyPluginContext));

    let buildResults: IBuildResult[] = [];
    const builtPluginContexts: IBuiltPluginContext<unknown>[] = [];

    // TODO: Extract this logic
    let onWatch: Watcher | undefined;
    if (watch) {
        const onRebuildPlugins: EspackPlugin[] = getPluginsForLifecycle(allPlugins, BuildLifecycles.REBUILD);
        onWatch = (buildId: string, error: BuildFailure | undefined, result: BuildResult | undefined) => {
            if (result) {
                const previousBuildResultIndex: number = buildResults.findIndex(
                    buildResult => buildResult.buildId === buildId
                );
                buildResults.splice(previousBuildResultIndex, 1, {
                    ...buildResults[previousBuildResultIndex],
                    buildResult: result
                });

                onRebuildPlugins.forEach((plugin, index) => plugin.onRebuild(builtPluginContexts[index]));
            }

            if (error) {
                console.error(error.message);
            }
        };
    }

    // Build, inject info from build
    const onBuildPlugins: EspackPlugin[] = getPluginsForLifecycle(allPlugins, BuildLifecycles.BUILD);
    const buildPlugins: Promise<unknown>[] = onBuildPlugins.map(plugin => plugin.onBuild(buildReadyPluginContext));

    const results: [IBuildResult[], unknown[]] = await Promise.all([
        executeBuilds(buildReadyScripts, onWatch),
        Promise.all(buildPlugins)
    ]);
    buildResults = results[0];
    const pluginBuildResults: unknown[] = results[1];

    builtPluginContexts.push(
        ...pluginBuildResults.map(pluginBuildResult => ({
            ...buildReadyPluginContext,
            buildResults,
            pluginBuildResult
        }))
    );

    // After build
    const afterBuildPlugins: EspackPlugin[] = getPluginsForLifecycle(allPlugins, BuildLifecycles.AFTER_BUILD);
    afterBuildPlugins.forEach((plugin, index) => plugin.afterBuild(builtPluginContexts[index]));

    let pluginWatchCleanups: ICleanup[] | undefined;
    if (watch) {
        // On watch
        const onWatchPlugins: EspackPlugin[] = getPluginsForLifecycle(allPlugins, BuildLifecycles.WATCH);
        pluginWatchCleanups = onWatchPlugins.map((plugin, index) =>
            plugin.registerCustomWatcher(builtPluginContexts[index])
        );
    }

    return {
        stop: () => {
            // Cleanup
            buildResults.forEach(build => build.buildResult.stop && build.buildResult.stop());

            const onCleanupPlugins: EspackPlugin[] = getPluginsForLifecycle(allPlugins, BuildLifecycles.AFTER_BUILD);
            onCleanupPlugins.forEach((plugin, index) => plugin.onCleanup(builtPluginContexts[index]));

            if (pluginWatchCleanups) {
                pluginWatchCleanups.forEach(watchJob => watchJob.stop());
            }
        }
    };
};
