import { ClientBuild, Cleanup } from '../build.model';
import { buildScripts } from './builder.helpers';
import { checkScripts, copyAssets } from './utils/asset.utils';
import { getAssetFileName } from './utils/get-asset-filename';
import { injectAndWriteHtml, loadHtml } from './utils/html.utils';
import { checkResources, WatchedResource, watchResources } from './utils/resource.utils';

export const clientBuilder = async (
	{
		html,
		defaultBuildProfiles,
		scripts,
		styles = [],
		copyResources = [],
		minifyHtml: doHtmlMinification = false,
	}: ClientBuild,
	watch: boolean,
	buildProfile: string | undefined
): Promise<Cleanup> => {
	const resourcesToCheck = [html];
	copyResources.length && resourcesToCheck.push(...copyResources);
	styles.length && resourcesToCheck.push(...styles);
	const resourceChecks = checkResources(resourcesToCheck);

	const checkResults = await Promise.allSettled([checkScripts(scripts), resourceChecks]);

	if (checkResults.some(assetCheck => assetCheck.status === 'rejected')) {
		throw new Error('Failed to load some assets!');
	}

	//TODO: Css minification if required
	const [builds] = await Promise.all([
		buildScripts(scripts, watch, buildProfile, defaultBuildProfiles),
		copyAssets(copyResources),
		copyAssets(styles),
	]);

	const scriptResults = [
		...builds
			.map(build => (build.buildResult.outputFiles || []).map(outputFile => getAssetFileName(outputFile.path)))
			.reduce((acc, curr) => [...acc, ...curr], []),
	];

	//TODO: What happens when an entry point is renamed?
	injectAndWriteHtml(html, await loadHtml(html, doHtmlMinification), scriptResults, styles);

	let watchedResources: Cleanup | undefined;
	if (watch) {
		const mapRegularResource = (copyResource: string): WatchedResource => ({ src: copyResource });
		watchedResources = await watchResources([
			...copyResources.map(mapRegularResource),
			...styles.map(mapRegularResource),
			{
				src: html,
				onRebuild: htmlName => {
					loadHtml(htmlName, doHtmlMinification).then(htmlValue => {
						injectAndWriteHtml(htmlName, htmlValue, scriptResults, styles);
					});
				},
			},
		]);
	}

	return {
		stop: () => {
			builds.forEach(build => build.buildResult.stop && build.buildResult.stop());
			watchedResources && watchedResources.stop();
		},
	};
};
