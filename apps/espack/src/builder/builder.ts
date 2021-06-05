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
import { checkScripts, unlinkOld, writeOutputFiles } from '../utils';
import { BuildFailure, BuildResult, OutputFile } from 'esbuild';
import fs from 'fs';
import { DEFAULT_BUILDS_DIR } from '../constants/build.constants';
import { ProfileBuilder } from './profile-builder';
import { buildWithEsbuild, EsbuildWatcher } from './build-with-esbuild';
import { PluginExecutor } from './plugin-executor/plugin-executor';
import { BuildReadyPluginExecutor, IPluginBuildResult } from './plugin-executor/build-ready-plugin-executor';
import { BuiltPluginExecutor } from './plugin-executor/built-plugin-executor';

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

    let buildResults: IEspackBuildResult[] = [];
    // eslint-disable-next-line prefer-const
    let builtPluginExecutor: BuiltPluginExecutor;

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
                builtPluginExecutor.executeLifecycle(BuildLifecycles.AFTER_BUILD);
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

                builtPluginExecutor.executeLifecycle(BuildLifecycles.AFTER_WRITE);
            }

            if (error) {
                console.error(error.message);
            }
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
        buildWithEsbuild(buildReadyScripts, buildsDir, onWatch),
        Promise.all(buildPlugins)
    ]);
    buildResults = results[0];
    const pluginBuildResults: IPluginBuildResult[] = results[1];

    builtPluginExecutor = new BuiltPluginExecutor(allPlugins, {
        ...basePluginContext,
        buildReadyScripts,
        buildResults,
        pluginBuildResults
    });

    // After build
    builtPluginExecutor.executeLifecycle(BuildLifecycles.AFTER_BUILD);

    console.log('Writing changes...');
    buildResults.forEach(writeOutputFiles);
    console.log('Changes written...');

    builtPluginExecutor.executeLifecycle(BuildLifecycles.AFTER_WRITE);

    let pluginWatchCleanups: ICleanup[] | undefined;
    if (watch) {
        console.log('Registering watchers...');
        // On watch
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
