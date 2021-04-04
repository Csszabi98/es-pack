import { build as esbuilder } from 'esbuild';
import { deepStrictEqual } from 'assert';
import fs from 'fs';
import { BuildResult, CommonBuild, DeterministicEntryAsset, EntryAsset, BuildProfiles } from '../build/build.model';
import { createBuildableScript as createBuildReadyScript } from './builder.utils';
import { BUILD_ENCODING } from '../build/build.constants';

export const executeBuilds = async (scripts: DeterministicEntryAsset[]): Promise<BuildResult[]> => {
    const commonBuilds = scripts.reduce<CommonBuild[]>((acc, curr) => {
        const commonBuild = acc.find(build => deepStrictEqual(curr.buildProfile, build.buildProfile));
        return commonBuild
            ? [
                  ...acc,
                  {
                      ...commonBuild,
                      builds: [...commonBuild.builds, curr],
                  },
              ]
            : [
                  ...acc,
                  {
                      ...curr,
                      builds: [curr],
                  },
              ];
    }, []);

    const createOutdirPromises = commonBuilds.map(
        async ({ buildProfile: { outdir }, espackBuildProfile: { buildsDir } }) => {
            if (!fs.existsSync(buildsDir)) {
                await fs.promises.mkdir(buildsDir);
            }

            if (!fs.existsSync(outdir)) {
                await fs.promises.mkdir(outdir);
            }
        }
    );
    await Promise.all(createOutdirPromises);

    return Promise.all(
        commonBuilds.map(async build => ({
            build,
            buildResult: await esbuilder({
                ...build.buildProfile,
                entryPoints: build.builds.map(script => script.src),
            }),
        }))
    );
};

export const createBuildReadyScripts = (
    scripts: EntryAsset[],
    buildProfile: string | undefined,
    defaultBuildProfiles: BuildProfiles | undefined,
    buildProfiles: BuildProfiles | undefined,
    watch: boolean
): DeterministicEntryAsset[] => {
    const { peerDependencies }: { peerDependencies: Record<string, string> | undefined } = JSON.parse(
        fs.readFileSync('package.json', BUILD_ENCODING)
    );
    const external = peerDependencies ? Object.keys(peerDependencies) : [];

    const buildReadyScripts = scripts.map((script, index) =>
        createBuildReadyScript({
            script,
            watch,
            peerDependencies: external,
            numberOfBuilds: scripts.length,
            currentBuildIndex: index,
            buildProfile,
            defaultBuildProfiles,
            buildProfiles,
        })
    );

    // TODO: Add flag to limit output profile details
    if (buildReadyScripts.length) {
        console.log('Building scripts with the following profiles:');
        buildReadyScripts.forEach(build => console.log(build));
    }

    return buildReadyScripts;
};
