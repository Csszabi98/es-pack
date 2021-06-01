import {
    BuildLifecycles,
    IEspackPlugin,
    IBasePluginContext,
    IBuildReadyPluginContext,
    IBuiltPluginContext,
    DeterministicEspackPlugin
} from '../build/build.plugin';
import { getPluginsForLifecycle } from '../utils/get-plugins-for-lifecycle';
import { BuildProfiles, IBuild, IBuildResult, ICleanup, IDeterministicEntryAsset } from '../build/build.model';
import { createBuildReadyScripts, executeBuilds, unlinkOld, Watcher, writeChanges } from './builder.helpers';
import { checkScripts } from './builder.utils';
import { BuildFailure, BuildResult, OutputFile } from 'esbuild';
import { DEFAULT_BUILDS_DIR } from '../build/build.constants';
import fs from 'fs';

interface IBuilder {
    defaultBuildProfiles?: BuildProfiles;
    defaultPlugins?: IEspackPlugin[];
    buildsDir?: string;
    build: IBuild;
    watch: boolean;
    buildProfile?: string;
    singleBuildMode: boolean;
}

export const builder = async ({
    watch,
    buildsDir = DEFAULT_BUILDS_DIR,
    buildProfile,
    singleBuildMode,
    defaultBuildProfiles,
    defaultPlugins,
    build: { scripts, buildProfiles, plugins }
}: IBuilder): Promise<ICleanup> => {
    const allPlugins: IEspackPlugin[] = [...(defaultPlugins || []), ...(plugins || [])];

    const basePluginContext: IBasePluginContext = {
        buildsDir: buildsDir,
        scripts,
        defaultBuildProfiles
    };
    // Before check resources
    const beforeResourceCheckPlugins: DeterministicEspackPlugin<BuildLifecycles.BEFORE_RESOURCE_CHECK>[] = getPluginsForLifecycle(
        allPlugins,
        BuildLifecycles.BEFORE_RESOURCE_CHECK
    );
    beforeResourceCheckPlugins.forEach(plugin => plugin.beforeResourceCheck(basePluginContext));

    // Check resources
    const onResourceCheckPlugins: DeterministicEspackPlugin<BuildLifecycles.RESOURCE_CHECK>[] = getPluginsForLifecycle(
        allPlugins,
        BuildLifecycles.RESOURCE_CHECK
    );
    const pluginResourceChecks: Promise<void>[] = onResourceCheckPlugins.map(plugin =>
        plugin.onResourceCheck(basePluginContext)
    );
    const resourceChecks: Promise<void>[] = [checkScripts(scripts), ...pluginResourceChecks];

    const checkResults: PromiseSettledResult<void>[] = await Promise.allSettled(resourceChecks);

    if (checkResults.some(assetCheck => assetCheck.status === 'rejected')) {
        throw new Error('Failed to load some assets!');
    }

    // After check resources
    const afterResourceCheckPlugins: DeterministicEspackPlugin<BuildLifecycles.AFTER_RESOURCE_CHECK>[] = getPluginsForLifecycle(
        allPlugins,
        BuildLifecycles.AFTER_RESOURCE_CHECK
    );
    afterResourceCheckPlugins.forEach(plugin => plugin.afterResourceCheck(basePluginContext));

    // Before build
    const buildReadyScripts: IDeterministicEntryAsset[] = createBuildReadyScripts({
        buildsDir,
        scripts,
        buildProfile,
        defaultBuildProfiles,
        buildProfiles,
        watch,
        singleBuildMode
    });
    const buildReadyPluginContext: IBuildReadyPluginContext = {
        ...basePluginContext,
        buildReadyScripts
    };

    const beforeBuildPlugins: DeterministicEspackPlugin<BuildLifecycles.BEFORE_BUILD>[] = getPluginsForLifecycle(
        allPlugins,
        BuildLifecycles.BEFORE_BUILD
    );
    beforeBuildPlugins.forEach(plugin => plugin.beforeBuild(buildReadyPluginContext));

    let buildResults: IBuildResult[] = [];
    const builtPluginContexts: IBuiltPluginContext<unknown>[] = [];

    const afterBuildPlugins: DeterministicEspackPlugin<BuildLifecycles.AFTER_BUILD>[] = getPluginsForLifecycle(
        allPlugins,
        BuildLifecycles.AFTER_BUILD
    );
    const afterWritePlugins: DeterministicEspackPlugin<BuildLifecycles.AFTER_WRITE>[] = getPluginsForLifecycle(
        allPlugins,
        BuildLifecycles.AFTER_WRITE
    );
    // TODO: Extract this logic
    let onWatch: Watcher | undefined;
    if (watch) {
        onWatch = async (buildId: string, error: BuildFailure | undefined, result: BuildResult | undefined) => {
            if (result) {
                console.log('[watch] espack after works started...');
                const label: string = '[watch] espack after works finished under';
                console.time(label);

                const previousBuildResultIndex: number = buildResults.findIndex(
                    buildResult => buildResult.buildId === buildId
                );
                const previousBuildResult: IBuildResult = buildResults[previousBuildResultIndex];
                const newBuildResult: IBuildResult = {
                    ...previousBuildResult,
                    buildResult: result
                };

                buildResults.splice(previousBuildResultIndex, 1, newBuildResult);

                console.log('[watch] executing plugins...');
                afterBuildPlugins.forEach((plugin, index) => plugin.afterBuild(builtPluginContexts[index]));
                console.log('[watch] plugins executed...');

                console.log('[watch] build writing changes');
                writeChanges(newBuildResult);
                console.log('[watch] build changes written');
                console.timeEnd(label);

                const staleFiles: OutputFile[] | undefined = previousBuildResult.buildResult.outputFiles?.filter(
                    oldOutFile =>
                        !newBuildResult.buildResult.outputFiles?.some(newOutFile => newOutFile.path === oldOutFile.path)
                );
                if (staleFiles?.length) {
                    console.log('[watch] cleaning stale files...');
                    unlinkOld(staleFiles);
                    console.log('[watch] stale files cleaned');
                }

                afterWritePlugins.forEach((plugin, index) => plugin.afterWrite(builtPluginContexts[index]));
            }

            if (error) {
                console.error(error.message);
            }
        };
    }

    if (!fs.existsSync(buildsDir)) {
        fs.mkdirSync(buildsDir);
    }

    // Build, inject info from build
    const onBuildPlugins: DeterministicEspackPlugin<BuildLifecycles.BUILD>[] = getPluginsForLifecycle(
        allPlugins,
        BuildLifecycles.BUILD
    );
    const buildPlugins: Promise<unknown>[] = onBuildPlugins.map(plugin => plugin.onBuild(buildReadyPluginContext));

    const results: [IBuildResult[], unknown[]] = await Promise.all([
        executeBuilds(buildReadyScripts, onWatch),
        Promise.all(buildPlugins)
    ]);
    buildResults = results[0];
    const pluginBuildResults: unknown[] = results[1];

    builtPluginContexts.push(
        ...pluginBuildResults
            .filter((__, index) => onBuildPlugins[index][BuildLifecycles.AFTER_BUILD])
            .map(pluginBuildResult => ({
                ...buildReadyPluginContext,
                buildResults,
                pluginBuildResult
            }))
    );

    // After build
    afterBuildPlugins.forEach((plugin, index) => plugin.afterBuild(builtPluginContexts[index]));

    console.log('Writing changes...');
    buildResults.forEach(writeChanges);
    console.log('Changes written...');

    afterWritePlugins.forEach((plugin, index) => plugin.afterWrite(builtPluginContexts[index]));

    const watchPluginContexts: IBuiltPluginContext<unknown>[] = [];
    watchPluginContexts.push(
        ...pluginBuildResults
            .filter((__, index) => onBuildPlugins[index][BuildLifecycles.WATCH])
            .map(pluginBuildResult => ({
                ...buildReadyPluginContext,
                buildResults,
                pluginBuildResult
            }))
    );

    let pluginWatchCleanups: ICleanup[] | undefined;
    if (watch) {
        console.log('Registering watchers...');
        // On watch
        const onWatchPlugins: DeterministicEspackPlugin<BuildLifecycles.WATCH>[] = getPluginsForLifecycle(
            allPlugins,
            BuildLifecycles.WATCH
        );
        pluginWatchCleanups = onWatchPlugins.map((plugin, index) =>
            plugin.registerCustomWatcher(watchPluginContexts[index])
        );
        console.log('Watchers registered...');
    }

    return {
        stop: () => {
            // Cleanup
            buildResults.forEach(build => build.buildResult.stop && build.buildResult.stop());

            const onCleanupPlugins: DeterministicEspackPlugin<BuildLifecycles.CLEANUP>[] = getPluginsForLifecycle(
                allPlugins,
                BuildLifecycles.CLEANUP
            );
            onCleanupPlugins.forEach((plugin, index) => plugin.onCleanup(builtPluginContexts[index]));

            if (pluginWatchCleanups) {
                pluginWatchCleanups.forEach(watchJob => watchJob.stop());
            }
        }
    };
};
