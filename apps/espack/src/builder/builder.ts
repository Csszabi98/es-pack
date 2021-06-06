import {
    BuildLifecycles,
    BuildProfiles,
    DefaultBuildProfiles,
    IBasePluginContext,
    ICleanup,
    IDeterministicEntryAsset,
    IEspackBuild,
    IEspackBuildResult,
    IEspackMarkedPlugin,
    IEspackPlugin
} from '../model';
import { checkScripts, writeOutputFiles } from '../utils';
import fs from 'fs';
import { DEFAULT_BUILDS_DIR } from '../constants/build.constants';
import { ProfileBuilder } from './profile-builder';
import { buildWithEsbuild, GetEsbuildWatcher } from './build-with-esbuild';
import { PluginExecutor } from './plugin-executor/plugin-executor';
import { BuildReadyPluginExecutor, IPluginBuildResult } from './plugin-executor/build-ready-plugin-executor';
import { BuiltPluginExecutor } from './plugin-executor/built-plugin-executor';
import { EsbuildWatcher, esbuildWatcherFactory } from './esbuild-watcher-factory';

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
    defaultPlugins = [],
    build: { scripts, buildProfiles = {}, plugins = [] }
}: IBuilder): Promise<ICleanup> => {
    const allPlugins: IEspackMarkedPlugin[] = [...defaultPlugins, ...plugins].map((plugin, index) => ({
        ...plugin,
        id: Symbol(index)
    }));
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
    const pluginExecutor: PluginExecutor = new PluginExecutor(allPlugins, basePluginContext);

    // Before check resources
    pluginExecutor.executeLifecycle(BuildLifecycles.BEFORE_RESOURCE_CHECK);

    // Check resources
    const pluginResourceChecks: Promise<void>[] = pluginExecutor.executeLifecycle(BuildLifecycles.RESOURCE_CHECK);
    const resourceChecks: Promise<void>[] = [checkScripts(scripts), ...pluginResourceChecks];

    const checkResults: PromiseSettledResult<void>[] = await Promise.allSettled(resourceChecks);

    if (checkResults.some(assetCheck => assetCheck.status === 'rejected')) {
        throw new Error('Failed to load some assets!');
    }

    // After check resources
    pluginExecutor.executeLifecycle(BuildLifecycles.AFTER_RESOURCE_CHECK);

    // Before build
    const buildReadyScripts: IDeterministicEntryAsset[] = new ProfileBuilder({
        ...buildOptionRelatedProperties,
        scripts,
        watch,
        singleBuildMode
    }).build();

    let getEsbuildWatcher: GetEsbuildWatcher | undefined;
    let resolveEsbuildWatcher: ((value: EsbuildWatcher) => void) | undefined;
    if (watch) {
        let cachedWatcher: EsbuildWatcher | undefined;
        const esbuildWatcherPromise: Promise<EsbuildWatcher> = new Promise(resolve => {
            resolveEsbuildWatcher = resolve;
        });
        getEsbuildWatcher = async (): Promise<EsbuildWatcher> => {
            if (!cachedWatcher) {
                // Race condition can be safely ignored here, as the promise is only resolved once, and multiple
                // modifications of the cachedWatcher variable would all set the same value to it.
                // eslint-disable-next-line require-atomic-updates
                cachedWatcher = await esbuildWatcherPromise;
            }
            return cachedWatcher;
        };
    }

    const buildReadyPluginExecutor: BuildReadyPluginExecutor = new BuildReadyPluginExecutor(allPlugins, {
        ...basePluginContext,
        buildReadyScripts
    });

    buildReadyPluginExecutor.executeLifecycle(BuildLifecycles.BEFORE_BUILD);

    if (!fs.existsSync(buildsDir)) {
        fs.mkdirSync(buildsDir);
    }

    // Build, inject info from build
    const buildPlugins: Promise<IPluginBuildResult>[] = buildReadyPluginExecutor.executeLifecycle(BuildLifecycles.BUILD);

    const results: [IEspackBuildResult[], IPluginBuildResult[]] = await Promise.all([
        buildWithEsbuild(buildReadyScripts, buildsDir, getEsbuildWatcher),
        Promise.all(buildPlugins)
    ]);
    const [buildResults, pluginBuildResults] = results;

    const builtPluginExecutor: BuiltPluginExecutor = new BuiltPluginExecutor(allPlugins, {
        ...basePluginContext,
        buildReadyScripts,
        buildResults,
        pluginBuildResults
    });
    if (resolveEsbuildWatcher) {
        resolveEsbuildWatcher(esbuildWatcherFactory(builtPluginExecutor));
    }

    // After build
    builtPluginExecutor.executeLifecycle(BuildLifecycles.AFTER_BUILD);

    console.log('Writing changes...');
    buildResults.forEach(espackBuildResult => writeOutputFiles(espackBuildResult.esbuildBuildResult));
    console.log('Changes written...');

    builtPluginExecutor.executeLifecycle(BuildLifecycles.AFTER_WRITE);

    let pluginWatchCleanups: ICleanup[] | undefined;
    if (watch) {
        console.log('Registering watchers...');
        // On watch, register the plugin watchers
        pluginWatchCleanups = builtPluginExecutor.executeLifecycle(BuildLifecycles.WATCH);
        console.log('Watchers registered...');
    }

    return {
        stop: () => {
            // Cleanup
            buildResults.forEach(build => build.esbuildBuildResult.stop && build.esbuildBuildResult.stop());

            // Cleanup plugins
            builtPluginExecutor.executeLifecycle(BuildLifecycles.CLEANUP);

            if (pluginWatchCleanups) {
                pluginWatchCleanups.forEach(watchJob => watchJob.stop());
            }
        }
    };
};
