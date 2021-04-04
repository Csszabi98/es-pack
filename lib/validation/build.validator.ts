import Joi from 'joi';
import { Builds, EntryAsset, EntryAssetTransformations, ImportFormat, Platforms, Build } from '../build/build.model';

// const JoiStringArray = Joi.array().items(Joi.string());
const JoiRequiredString = Joi.string().required();

const validJsVariableNamePattern = '[a-zA-Z_$][0-9a-zA-Z_$]*';

const environmentVariablesSchema = Joi.object<Record<string, string>>({}).pattern(
    Joi.string().pattern(new RegExp(validJsVariableNamePattern)),
    Joi.string()
);

const entryAssetTransformationSchema = Joi.object<EntryAssetTransformations>({
    minify: Joi.boolean(),
    sourcemap: Joi.boolean(),
    bundle: Joi.boolean(),
    platform: Joi.string().valid(...Object.values(Platforms)),
    format: Joi.string().valid(...Object.values(ImportFormat)),
    splitting: Joi.boolean(),
    define: environmentVariablesSchema,
});

const entryAssetTransformationRecordSchema = Joi.object<Record<string, EntryAssetTransformations>>({}).pattern(
    Joi.string(),
    entryAssetTransformationSchema
);

const entryAssetSchema = Joi.object<EntryAsset>({
    src: JoiRequiredString,
    buildProfiles: entryAssetTransformationRecordSchema,
});

const buildSchema = Joi.object<Build>({
    scripts: Joi.array().items(entryAssetSchema).required(),
    buildProfiles: entryAssetTransformationRecordSchema,
});

export const buildsSchema = Joi.object<Builds>({
    builds: Joi.array().items(buildSchema).required(),
});
