import { Cleanup, RegularBuild } from '../build/build.model';
import { buildScripts } from './builder.helpers';
import { checkScripts, copyAssets } from './utils/asset.utils';
import { checkResources, watchResources } from './utils/resource.utils';

export const builder = async (
    { scripts, copyResources = [], defaultBuildProfiles }: RegularBuild,
    watch: boolean,
    buildProfile: string | undefined
): Promise<Cleanup> => {
    const resourceChecks = [checkScripts(scripts)];

    if (copyResources.length) {
        resourceChecks.push(checkResources(copyResources));
    }

    const checkResults = await Promise.allSettled(resourceChecks);

    if (checkResults.some(assetCheck => assetCheck.status === 'rejected')) {
        throw new Error('Failed to load some assets!');
    }

    const [builds] = await Promise.all([
        buildScripts(scripts, watch, buildProfile, defaultBuildProfiles),
        copyAssets(copyResources),
    ]);

    let watchedResources: Cleanup | undefined;
    if (watch) {
        watchedResources = await watchResources(copyResources.map(copyResource => ({ src: copyResource })));
    }

    return {
        stop: () => {
            builds.forEach(build => build.buildResult.stop && build.buildResult.stop());
            watchedResources && watchedResources.stop();
        },
    };
};
