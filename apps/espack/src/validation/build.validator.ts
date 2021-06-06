import Joi from 'joi';
import { Plugin } from 'esbuild';
import {
    IEspackBuilds,
    IEntryAsset,
    BuildProfile,
    ImportFormat,
    Platforms,
    IEspackBuild,
    BuildLifecycles,
    IEspackPlugin
} from '../model';

const JoiStringArray: Joi.ArraySchema = Joi.array().items(Joi.string());
const JoiRequiredString: Joi.StringSchema = Joi.string().required();

const validJsVariableNamePattern: string = '[a-zA-Z_$][0-9a-zA-Z_$]*';

const environmentVariablesSchema: Joi.ObjectSchema<Record<string, string>> = Joi.object<Record<string, string>>({}).pattern(
    Joi.string().pattern(new RegExp(validJsVariableNamePattern)),
    Joi.string()
);

const loaderSchema: Joi.ObjectSchema<Record<string, string>> = Joi.object<Record<string, string>>({}).pattern(
    Joi.string().pattern(new RegExp('^\\.')),
    Joi.string().valid('js', 'jsx', 'ts', 'tsx', 'css', 'json', 'text', 'base64', 'file', 'dataurl', 'binary', 'default')
);

const stringRecordSchema: Joi.ObjectSchema<Record<string, string>> = Joi.object<Record<string, string>>({}).pattern(
    Joi.string(),
    Joi.string()
);

const esbuildPluginSchema: Joi.ObjectSchema<Plugin> = Joi.object<Plugin>({
    name: Joi.string(),
    setup: Joi.function().arity(1)
});

const espackPluginInstanceSchema: Joi.ObjectSchema<IEspackPlugin> = Joi.object({
    name: Joi.string().required(),
    ...Object.values(BuildLifecycles).map(lifecycle => ({
        [lifecycle]: Joi.function().arity(1)
    }))
}).unknown(true);
const espackPluginArraySchema: Joi.ArraySchema = Joi.array().items(espackPluginInstanceSchema);

const entryAssetTransformationSchema: Joi.ObjectSchema<BuildProfile> = Joi.object<BuildProfile>({
    sourcemap: Joi.boolean(),
    bundle: Joi.boolean(),
    platform: Joi.string().valid(...Object.values(Platforms)),
    format: Joi.string().valid(...Object.values(ImportFormat)),
    splitting: Joi.boolean(),
    define: environmentVariablesSchema,
    plugins: Joi.array().items(esbuildPluginSchema),
    preserveSymlinks: Joi.boolean(),
    absWorkingDir: Joi.string(),
    charset: Joi.string().valid('ascii', 'utf8'),
    color: Joi.boolean(),
    conditions: Joi.array().items(Joi.string()),
    external: JoiStringArray,
    entryNames: Joi.string(),
    globalName: Joi.string(),
    incremental: Joi.boolean(),
    jsxFactory: Joi.string(),
    jsxFragment: Joi.string(),
    keepNames: Joi.boolean(),
    loader: loaderSchema,
    logLevel: Joi.string().valid('info', 'warning', 'error', 'silent'),
    logLimit: Joi.number(),
    mainFields: JoiStringArray,
    minify: Joi.boolean(),
    minifyIdentifiers: Joi.boolean(),
    minifySyntax: Joi.boolean(),
    minifyWhitespace: Joi.boolean(),
    resolveExtensions: Joi.string(),
    sourcesContent: Joi.boolean(),
    sourceRoot: Joi.string(),
    target: Joi.alternatives().try(Joi.string(), JoiStringArray),
    treeShaking: Joi.alternatives().try(Joi.boolean().allow(true), Joi.string().allow('ignore-annotations')),
    tsconfig: Joi.string(),
    assetNames: Joi.string(),
    footer: Joi.string(),
    banner: stringRecordSchema,
    outbase: Joi.string(),
    outdir: Joi.string(),
    nodePaths: JoiStringArray,
    outExtension: stringRecordSchema,
    publicPath: Joi.string(),
    chunkNames: Joi.string(),
    inject: JoiStringArray,
    pure: JoiStringArray
}).unknown(false);

const entryAssetTransformationRecordSchema: Joi.ObjectSchema<Record<string, BuildProfile>> = Joi.object<
    Record<string, BuildProfile>
>({}).pattern(Joi.string(), entryAssetTransformationSchema);

const entryAssetSchema: Joi.AlternativesSchema = Joi.alternatives(
    Joi.object<IEntryAsset>({
        src: JoiRequiredString,
        buildProfiles: entryAssetTransformationRecordSchema
    }).unknown(false),
    Joi.string()
);

const buildSchema: Joi.ObjectSchema<IEspackBuild> = Joi.object<IEspackBuild>({
    scripts: Joi.array().items(entryAssetSchema).required(),
    plugins: espackPluginArraySchema,
    buildProfiles: entryAssetTransformationRecordSchema
}).unknown(false);

export const buildsSchema: Joi.ObjectSchema<IEspackBuilds> = Joi.object<IEspackBuilds>({
    buildsDir: Joi.string(),
    defaultBuildProfiles: entryAssetTransformationRecordSchema,
    builds: Joi.array().items(buildSchema).required()
}).unknown(false);
