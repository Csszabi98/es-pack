import { build as esbuilder, BuildFailure, BuildResult } from 'esbuild';
import deepEqual from 'deep-equal';
import fs from 'fs';
import { IBuildResult, ICommonBuild, IDeterministicEntryAsset, IEntryAsset, BuildProfiles } from '../build/build.model';
import { createBuildableScript as createBuildReadyScript } from './builder.utils';

export type Watcher = (buildId: string, error: BuildFailure | undefined, result: BuildResult | undefined) => void;

export const executeBuilds = async (
    scripts: IDeterministicEntryAsset[],
    onWatch: Watcher | undefined
): Promise<IBuildResult[]> => {
    const commonBuilds: ICommonBuild[] = scripts.reduce<ICommonBuild[]>((acc, curr) => {
        const { src, ...currProfiles } = curr;
        const commonBuildIndex: number = acc.findIndex(build =>
            deepEqual(currProfiles.buildProfile, build.buildProfile, { strict: true })
        );

        if (commonBuildIndex !== -1) {
            acc[commonBuildIndex] = {
                ...acc[commonBuildIndex],
                builds: [...acc[commonBuildIndex].builds, { src }]
            };
            return acc;
        }

        return [
            ...acc,
            {
                ...currProfiles,
                builds: [{ src }]
            }
        ];
    }, []);

    const createOutdirPromises: Promise<void>[] = commonBuilds.map(async ({ buildProfile: { outdir } }) => {
        if (!fs.existsSync(outdir)) {
            await fs.promises.mkdir(outdir);
        }
    });
    await Promise.all(createOutdirPromises);

    return Promise.all(
        commonBuilds.map(async (build, index) => {
            // TODO: Replace with proper buildIds
            const buildId: string = `build_${index}`;
            return {
                buildId,
                build,
                buildResult: await esbuilder({
                    ...build.buildProfile,
                    entryPoints: build.builds.map(script => script.src),
                    watch: onWatch
                        ? {
                              onRebuild(error: BuildFailure | null, result: BuildResult | null) {
                                  onWatch(buildId, error || undefined, result || undefined);
                              }
                          }
                        : false,
                    write: false
                })
            };
        })
    );
};

interface ICreateBuildReadyScripts {
    buildsDir: string;
    scripts: IEntryAsset[];
    buildProfile: string | undefined;
    defaultBuildProfiles: BuildProfiles | undefined;
    buildProfiles: BuildProfiles | undefined;
    watch: boolean;
    singleBuildMode: boolean;
}

export const createBuildReadyScripts = ({
    buildsDir,
    scripts,
    buildProfile,
    defaultBuildProfiles,
    buildProfiles,
    watch,
    singleBuildMode
}: ICreateBuildReadyScripts): IDeterministicEntryAsset[] => {
    const buildReadyScripts: IDeterministicEntryAsset[] = scripts.map((script, index) =>
        createBuildReadyScript({
            script,
            watch,
            buildsDir,
            singleBuildMode,
            currentBuildIndex: index,
            buildProfile,
            defaultBuildProfiles,
            buildProfiles
        })
    );

    // TODO: Add flag to limit output profile details
    if (buildReadyScripts.length) {
        console.log('Building scripts with the following profiles:');
        buildReadyScripts.forEach(build => console.log(build));
    }

    return buildReadyScripts;
};
