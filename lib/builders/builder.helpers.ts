import { build as esbuilder, Plugin, BuildOptions } from 'esbuild';
import { deepStrictEqual } from 'assert';
import fs from 'fs';
import { DeterministicEntryAsset, EntryAsset, BuildProfiles, ImportFormat } from '../build/build.model';
import { BuildResult, CommonBuild } from './builder.model';
import { createDeterministicEntryAsset } from './utils/asset.utils';
import { mapEnvironmentVariables, defaultBuildOptionsFactory } from './utils/build.utils';
import { BUILD_ENCODING } from '../build/build.constants';
import { getAssetFileName } from './utils/get-asset-filename';

export const createBuilds = (
	scripts: DeterministicEntryAsset[],
	defaultBuildOptions: BuildOptions,
	external: string[] | undefined
): Promise<BuildResult>[] => {
	try {
		const builds = scripts.reduce<CommonBuild[]>((acc, curr) => {
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
							buildProfile: curr.buildProfile,
							builds: [curr],
						},
				  ];
		}, []);

		return builds.map(async commonBuild => {
			const {
				minify,
				platform,
				sourcemap,
				bundle,
				environmentVariables,
				codeSplitting,
				format,
				preact,
			} = commonBuild.buildProfile;
			const splitting = codeSplitting
				? {
						chunkNames: 'chunks/[name]-[hash]',
						format: ImportFormat.ESM,
				  }
				: undefined;
			const jsx = preact
				? {
						jsxFactory: 'h',
						jsxFragment: 'Fragment',
				  }
				: undefined;
			return {
				builds: commonBuild.builds,
				buildResult: await esbuilder({
					...defaultBuildOptions,
					define: environmentVariables && mapEnvironmentVariables(environmentVariables),
					platform,
					minify,
					sourcemap,
					bundle,
					entryPoints: commonBuild.builds.map(script => script.src),
					plugins: defaultBuildOptions.plugins,
					external,
					format,
					splitting: codeSplitting,
					...splitting,
					...jsx,
				}),
			};
		});
	} catch (e) {
		throw e;
	}
};

export const groupBuilds = (
	scripts: EntryAsset[],
	buildProfile: string | undefined,
	defaultBuildProfiles: BuildProfiles | undefined
): DeterministicEntryAsset[] => {
	const deterministicScripts = scripts.map(script =>
		createDeterministicEntryAsset(script, buildProfile, defaultBuildProfiles)
	);

	const standardBuilds = deterministicScripts.filter(script => !script.buildProfile.compat);

	if (standardBuilds.length) {
		console.log('Building scripts with the following profiles:');
		standardBuilds.forEach(build => console.log(build));
	}

	return standardBuilds;
};

export const buildScripts = async (
	scripts: EntryAsset[],
	watch: boolean,
	buildProfile: string | undefined,
	defaultBuildProfiles: BuildProfiles | undefined
): Promise<BuildResult[]> => {
	const compatBuilds = groupBuilds(scripts, buildProfile, defaultBuildProfiles);

	if (!fs.existsSync('dist')) {
		await fs.promises.mkdir('dist');
	}

	const defaultBuildOptions = defaultBuildOptionsFactory(watch);
	// Gather peerDependencies to be excluded from the bundle
	if (!fs.existsSync('package.json')) {
		throw new Error('Could not find package.json file!');
	}

	const { peerDependencies }: { peerDependencies: Record<string, string> | undefined } = JSON.parse(
		fs.readFileSync('package.json', BUILD_ENCODING)
	);
	const external = peerDependencies && Object.keys(peerDependencies);

	return await Promise.all(createBuilds(compatBuilds, defaultBuildOptions, external));
};
