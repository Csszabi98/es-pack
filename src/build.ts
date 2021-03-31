import { Builds, Cleanup } from './build.model';
import { builder } from './builders/builder';
import { clientBuilder } from './builders/client-builder';
import { checkAllResourcesAreUnique } from './builders/utils/resource.utils';

export interface BuildProps {
	builds: Builds;
	watch: boolean;
}

export const build = async ({ builds, watch }: BuildProps, buildProfile: string | undefined): Promise<Cleanup[]> => {
	checkAllResourcesAreUnique(builds);

	if (watch) {
		console.log(`Watch mode is enabled!`);
	}

	return await Promise.all([
		...builds.clientBuilds.map(clientBuild => clientBuilder(clientBuild, watch, buildProfile)),
		...builds.regularBuilds.map(regularBuild => builder(regularBuild, watch, buildProfile)),
	]);
};
