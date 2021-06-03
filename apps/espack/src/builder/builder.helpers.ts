import { build as esbuilder, BuildFailure, BuildResult, OutputFile } from 'esbuild';
import deepEqual from 'deep-equal';
import fs from 'fs';
import { IBuildResult, ICommonBuild, IDeterministicEntryAsset, IEntryAsset, BuildProfiles } from '../build/build.model';
import { createBuildableScript as createBuildReadyScript } from './builder.utils';
import path from 'path';

export type Watcher = (buildId: string, error: BuildFailure | undefined, result: BuildResult | undefined) => void;

export const executeBuilds = async (
    scripts: IDeterministicEntryAsset[],
    buildsDir: string,
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

    return Promise.all(
        commonBuilds.map(async (build, index) => {
            // TODO: Replace with proper buildIds
            const buildId: string = `build_${index}`;
            return {
                buildId,
                build,
                buildResult: await esbuilder({
                    ...build.buildProfile,
                    outdir: path.join(buildsDir, build.buildProfile.outdir),
                    entryPoints: build.builds.map(script => script.src),
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
};

interface ICreateBuildReadyScripts {
    scripts: IEntryAsset[];
    buildProfile: string;
    defaultBuildProfiles: BuildProfiles;
    buildProfiles: BuildProfiles;
    watch: boolean;
    singleBuildMode: boolean;
}

export const createBuildReadyScripts = ({
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

export const unlinkOld = (staleFiles: OutputFile[]): void =>
    staleFiles.forEach(outFile => {
        if (fs.existsSync(outFile.path)) {
            fs.unlinkSync(outFile.path);
        }
    });

export const writeChanges = ({ buildResult }: IBuildResult): void =>
    buildResult.outputFiles?.forEach(outFile => {
        const dir: string = path.dirname(outFile.path);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outFile.path, outFile.contents);
    });
