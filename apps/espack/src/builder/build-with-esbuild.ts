import path from 'path';
import { build as esbuild, BuildFailure, BuildResult } from 'esbuild';
import deepEqual from 'deep-equal';
import { ICommonEspackBuild, IDeterministicEntryAsset, IEspackBuildResult } from '../model';

export const groupBuilds = (scripts: IDeterministicEntryAsset[]): ICommonEspackBuild[] => {
    return scripts.reduce<ICommonEspackBuild[]>((acc, curr) => {
        const { src, buildProfile } = curr;
        const commonBuildIndex: number = acc.findIndex(build =>
            deepEqual(buildProfile, build.buildProfile, { strict: true })
        );

        if (commonBuildIndex !== -1) {
            acc[commonBuildIndex] = {
                ...acc[commonBuildIndex],
                builds: [...acc[commonBuildIndex].builds, src]
            };
            return acc;
        }

        return [
            ...acc,
            {
                buildProfile,
                builds: [src]
            }
        ];
    }, []);
};

export type EsbuildWatcher = (buildId: string, error: BuildFailure | undefined, result: BuildResult | undefined) => void;

export const buildWithEsbuild = async (
    scripts: IDeterministicEntryAsset[],
    buildsDir: string,
    onWatch: EsbuildWatcher | undefined
): Promise<IEspackBuildResult[]> =>
    Promise.all(
        groupBuilds(scripts).map(async (build, index) => {
            // TODO: Replace with proper buildIds
            const buildId: string = `build_${index}`;
            return {
                buildId,
                build,
                esbuildBuildResult: await esbuild({
                    ...build.buildProfile,
                    outdir: path.join(buildsDir, build.buildProfile.outdir),
                    entryPoints: build.builds,
                    watch: onWatch
                        ? {
                              onRebuild(error: BuildFailure | null, result: BuildResult | null) {
                                  onWatch(buildId, error || undefined, result || undefined);
                              }
                          }
                        : false,
                    incremental: !!onWatch,
                    write: false
                })
            };
        })
    );
