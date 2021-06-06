import { BuildFailure, BuildResult, OutputFile } from 'esbuild';
import { BuildLifecycles } from '../model';
import { unlinkOld, writeOutputFiles } from '../utils';
import { BuiltPluginExecutor } from './plugin-executor/built-plugin-executor';

export type EsbuildWatcher = (buildId: string, error: BuildFailure | undefined, result: BuildResult | undefined) => void;

export const esbuildWatcherFactory = (builtPluginExecutor: BuiltPluginExecutor): EsbuildWatcher => (
    buildId: string,
    error: BuildFailure | undefined,
    result: BuildResult | undefined
): void => {
    if (error) {
        console.error(error.message);
    }

    if (!result) {
        return;
    }

    console.log('[watch] espack after works started...');
    const label: string = '[watch] espack after works finished under';
    console.time(label);

    const previousEsbuildBuildResult: BuildResult | undefined = builtPluginExecutor.updateEsbuildBuildResult(
        buildId,
        result
    );

    console.log('[watch] executing plugins...');
    builtPluginExecutor.executeLifecycle(BuildLifecycles.AFTER_BUILD);
    console.log('[watch] plugins executed...');

    console.log('[watch] build writing changes');
    writeOutputFiles(result);
    console.log('[watch] build changes written');
    console.timeEnd(label);

    const staleFiles: OutputFile[] | undefined = previousEsbuildBuildResult?.outputFiles?.filter(
        oldOutFile => !result.outputFiles?.some(newOutFile => newOutFile.path === oldOutFile.path)
    );
    if (staleFiles?.length) {
        console.log('[watch] cleaning stale files...');
        unlinkOld(staleFiles);
        console.log('[watch] stale files cleaned');
    }

    builtPluginExecutor.executeLifecycle(BuildLifecycles.AFTER_WRITE);
};
