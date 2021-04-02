import Joi from 'joi';
import {
	Builds,
	ClientBuild,
	EntryAsset,
	EntryAssetTransformations,
	ImportFormat,
	Platforms,
	RegularBuild,
} from '../build/build.model';

const JoiStringArray = Joi.array().items(Joi.string());
const JoiRequiredString = Joi.string().required();

const validJsVariableNamePattern = '[a-zA-Z_$][0-9a-zA-Z_$]*';

const environmentVariablesSchema = Joi.object<Record<string, string>>({}).pattern(
	Joi.string().pattern(new RegExp(validJsVariableNamePattern)),
	Joi.string()
);

const entryAssetTransformationSchema = Joi.object<EntryAssetTransformations>({
	minify: Joi.boolean(),
	sourceMap: Joi.boolean(),
	bundle: Joi.boolean(),
	platform: Joi.string().valid(...Object.values(Platforms)),
	format: Joi.string().valid(...Object.values(ImportFormat)),
	codeSplitting: Joi.boolean(),
	environmentVariables: environmentVariablesSchema,
});

const entryAssetTransformationRecordSchema = Joi.object<Record<string, EntryAssetTransformations>>({}).pattern(
	Joi.string(),
	entryAssetTransformationSchema
);

const entryAssetSchema = Joi.object<EntryAsset>({
	src: JoiRequiredString,
	buildProfiles: entryAssetTransformationRecordSchema,
});

const regularBuildSchema = Joi.object<RegularBuild>({
	scripts: Joi.array().items(entryAssetSchema).required(),
	copyResources: JoiStringArray,
	defaultBuildProfiles: entryAssetTransformationRecordSchema,
});

const clientBuildSchema = Joi.object<ClientBuild>({
	html: JoiRequiredString,
	minifyHtml: JoiRequiredString,
	scripts: Joi.array().items(entryAssetSchema).required(),
	styles: JoiStringArray,
	copyResources: JoiStringArray,
	defaultBuildProfiles: entryAssetTransformationRecordSchema,
});

export const buildsSchema = Joi.object<Builds>({
	clientBuilds: Joi.array().items(clientBuildSchema).required(),
	regularBuilds: Joi.array().items(regularBuildSchema).required(),
});
