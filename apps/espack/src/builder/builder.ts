import {
    BuildLifecycles,
    IEspackPlugin,
    IBasePluginContext,
    IBuildReadyPluginContext,
    IBuiltPluginContext,
    DeterministicEspackMarkedPlugin,
    IEspackMarkedPlugin
} from '../model';
import {
    BuildProfiles,
    DefaultBuildProfiles,
    IEspackBuild,
    IEspackBuildResult,
    ICleanup,
    IDeterministicEntryAsset
} from '../model';
import { checkScripts, getPluginsForLifecycle, unlinkOld, writeOutputFiles } from '../utils';
import { BuildFailure, BuildResult, OutputFile } from 'esbuild';
import fs from 'fs';
import { DEFAULT_BUILDS_DIR } from '../constants/build.constants';
import { ProfileBuilder } from './profile-builder';
import { buildWithEsbuild, EsbuildWatcher } from './build-with-esbuild';

interface IBuilder {
    defaultBuildProfiles?: BuildProfiles;
    defaultPlugins?: IEspackPlugin[];
    buildsDir?: string;
    build: IEspackBuild;
    watch: boolean;
    buildProfile?: string;
    singleBuildMode: boolean;
}

interface IBuildOptionRelatedProperties {
    buildProfile: string;
    defaultBuildProfiles: BuildProfiles;
    buildProfiles: BuildProfiles;
}

export const builder = async ({
    watch,
    buildsDir = DEFAULT_BUILDS_DIR,
    buildProfile = DefaultBuildProfiles.PROD,
    singleBuildMode,
    defaultBuildProfiles = {},
    defaultPlugins,
    build: { scripts, buildProfiles = {}, plugins }
}: IBuilder): Promise<ICleanup> => {
    const allPlugins: readonly IEspackMarkedPlugin[] = [
        ...(defaultPlugins || []),
        ...(plugins || [])
    ].map((plugin, index) => ({ ...plugin, id: Symbol(index) }));

    const buildOptionRelatedProperties: IBuildOptionRelatedProperties = {
        buildProfile,
        defaultBuildProfiles,
        buildProfiles
    };

    const basePluginContext: IBasePluginContext = {
        ...buildOptionRelatedProperties,
        buildsDir,
        scripts
    };
    // Before check resources
    const beforeResourceCheckPlugins: DeterministicEspackMarkedPlugin<BuildLifecycles.BEFORE_RESOURCE_CHECK>[] = getPluginsForLifecycle(
        allPlugins,
        BuildLifecycles.BEFORE_RESOURCE_CHECK
    );
    beforeResourceCheckPlugins.forEach(plugin => plugin.beforeResourceCheck(basePluginContext));

    // Check resources
    const onResourceCheckPlugins: DeterministicEspackMarkedPlugin<BuildLifecycles.RESOURCE_CHECK>[] = getPluginsForLifecycle(
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
    const afterResourceCheckPlugins: DeterministicEspackMarkedPlugin<BuildLifecycles.AFTER_RESOURCE_CHECK>[] = getPluginsForLifecycle(
        allPlugins,
        BuildLifecycles.AFTER_RESOURCE_CHECK
    );
    afterResourceCheckPlugins.forEach(plugin => plugin.afterResourceCheck(basePluginContext));

    // Before build
    const buildReadyScripts: IDeterministicEntryAsset[] = new ProfileBuilder({
        ...buildOptionRelatedProperties,
        scripts,
        watch,
        singleBuildMode
    }).build();
    const buildReadyPluginContext: IBuildReadyPluginContext = {
        ...basePluginContext,
        buildReadyScripts
    };

    const beforeBuildPlugins: DeterministicEspackMarkedPlugin<BuildLifecycles.BEFORE_BUILD>[] = getPluginsForLifecycle(
        allPlugins,
        BuildLifecycles.BEFORE_BUILD
    );
    beforeBuildPlugins.forEach(plugin => plugin.beforeBuild(buildReadyPluginContext));

    let buildResults: IEspackBuildResult[] = [];
    const afterWritePluginContexts: IBuiltPluginContext<unknown>[] = [];
    const afterBuildPluginContexts: IBuiltPluginContext<unknown>[] = [];

    const afterBuildPlugins: DeterministicEspackMarkedPlugin<BuildLifecycles.AFTER_BUILD>[] = getPluginsForLifecycle(
        allPlugins,
        BuildLifecycles.AFTER_BUILD
    );
    const afterWritePlugins: DeterministicEspackMarkedPlugin<BuildLifecycles.AFTER_WRITE>[] = getPluginsForLifecycle(
        allPlugins,
        BuildLifecycles.AFTER_WRITE
    );
    // TODO: Extract this logic
    let onWatch: EsbuildWatcher | undefined;
    if (watch) {
        onWatch = async (buildId: string, error: BuildFailure | undefined, result: BuildResult | undefined) => {
            if (result) {
                console.log('[watch] espack after works started...');
                const label: string = '[watch] espack after works finished under';
                console.time(label);

                const previousBuildResultIndex: number = buildResults.findIndex(
                    buildResult => buildResult.buildId === buildId
                );
                const previousBuildResult: IEspackBuildResult = buildResults[previousBuildResultIndex];
                const newBuildResult: IEspackBuildResult = {
                    ...previousBuildResult,
                    esbuildBuildResult: result
                };

                buildResults.splice(previousBuildResultIndex, 1, newBuildResult);

                console.log('[watch] executing plugins...');
                afterBuildPlugins.forEach((plugin, index) => plugin.afterBuild(afterBuildPluginContexts[index]));
                console.log('[watch] plugins executed...');

                console.log('[watch] build writing changes');
                writeOutputFiles(newBuildResult);
                console.log('[watch] build changes written');
                console.timeEnd(label);

                const staleFiles: OutputFile[] | undefined = previousBuildResult.esbuildBuildResult.outputFiles?.filter(
                    oldOutFile =>
                        !newBuildResult.esbuildBuildResult.outputFiles?.some(
                            newOutFile => newOutFile.path === oldOutFile.path
                        )
                );
                if (staleFiles?.length) {
                    console.log('[watch] cleaning stale files...');
                    unlinkOld(staleFiles);
                    console.log('[watch] stale files cleaned');
                }

                afterWritePlugins.forEach((plugin, index) => plugin.afterWrite(afterWritePluginContexts[index]));
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
    const onBuildPlugins: DeterministicEspackMarkedPlugin<BuildLifecycles.BUILD>[] = getPluginsForLifecycle(
        allPlugins,
        BuildLifecycles.BUILD
    );
    const buildPlugins: Promise<unknown>[] = onBuildPlugins.map(plugin => plugin.onBuild(buildReadyPluginContext));

    const results: [IEspackBuildResult[], unknown[]] = await Promise.all([
        buildWithEsbuild(buildReadyScripts, buildsDir, onWatch),
        Promise.all(buildPlugins)
    ]);
    buildResults = results[0];
    const pluginBuildResults: unknown[] = results[1];

    const builtPluginContextFactory = (plugins: { id: symbol }[]): IBuiltPluginContext<unknown>[] =>
        plugins.map(plugin => ({
            ...buildReadyPluginContext,
            buildResults,
            pluginBuildResult: pluginBuildResults[onBuildPlugins.findIndex(buildPlugin => buildPlugin.id === plugin.id)]
        }));

    afterBuildPluginContexts.push(...builtPluginContextFactory(afterBuildPlugins));
    afterWritePluginContexts.push(...builtPluginContextFactory(afterWritePlugins));

    // After build
    afterBuildPlugins.forEach((plugin, index) => plugin.afterBuild(afterBuildPluginContexts[index]));

    console.log('Writing changes...');
    buildResults.forEach(writeOutputFiles);
    console.log('Changes written...');

    afterWritePlugins.forEach((plugin, index) => plugin.afterWrite(afterBuildPluginContexts[index]));

    let pluginWatchCleanups: ICleanup[] | undefined;
    if (watch) {
        console.log('Registering watchers...');
        // On watch
        const onWatchPlugins: DeterministicEspackMarkedPlugin<BuildLifecycles.WATCH>[] = getPluginsForLifecycle(
            allPlugins,
            BuildLifecycles.WATCH
        );
        const watchPluginContexts: IBuiltPluginContext<unknown>[] = builtPluginContextFactory(onWatchPlugins);
        pluginWatchCleanups = onWatchPlugins.map((plugin, index) =>
            plugin.registerCustomWatcher(watchPluginContexts[index])
        );
        console.log('Watchers registered...');
    }

    return {
        stop: () => {
            // Cleanup
            buildResults.forEach(build => build.esbuildBuildResult.stop && build.esbuildBuildResult.stop());

            const onCleanupPlugins: DeterministicEspackMarkedPlugin<BuildLifecycles.CLEANUP>[] = getPluginsForLifecycle(
                allPlugins,
                BuildLifecycles.CLEANUP
            );
            onCleanupPlugins.forEach((plugin, index) => plugin.onCleanup(afterBuildPluginContexts[index]));

            if (pluginWatchCleanups) {
                pluginWatchCleanups.forEach(watchJob => watchJob.stop());
            }
        }
    };
};
