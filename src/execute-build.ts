import fs from 'fs';
import {
	BUILD_ENCODING,
	clientBuildSchema,
	entryAssetSchema,
	buildProfilesSchema,
	buildsSchema,
	regularBuildSchema,
} from './build.constants';
import { Validator } from 'jsonschema';
import { Builds, Cleanup } from './build.model';
import { build } from './build';
import { getArgument } from './builders/utils/get-argument';

const timeLabel = 'Built under';
console.log('Starting build...');
console.time(timeLabel);

export const executeBuild = async (): Promise<Cleanup[] | null> => {
	const profile = getArgument('profile');
	const watch = process.argv.includes('--watch');

	const configPath = 'build.json';
	if (!fs.existsSync(configPath)) {
		throw new Error(`Could not find ${configPath}!`);
	}

	const configString = fs.readFileSync(configPath, {
		encoding: BUILD_ENCODING,
	});

	const validator = new Validator();
	validator.addSchema(buildProfilesSchema, buildProfilesSchema.id);
	validator.addSchema(entryAssetSchema, entryAssetSchema.id);
	validator.addSchema(regularBuildSchema, regularBuildSchema.id);
	validator.addSchema(clientBuildSchema, clientBuildSchema.id);

	const builds: Builds = JSON.parse(configString);

	const validation = validator.validate(builds, buildsSchema);
	if (!validation.valid) {
		console.error('The provided config is invalid!');
		console.table(validation.errors);
		return null;
	}

	return await build({ builds, watch }, profile);
};

executeBuild()
	.then(result => {
		result && result.forEach(cleanup => cleanup.stop);
		console.timeEnd(timeLabel);
	})
	.catch(e => {
		console.error(e);
		process.exit(1);
	});
