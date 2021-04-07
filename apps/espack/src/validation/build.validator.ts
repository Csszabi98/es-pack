import Joi from 'joi';
import { Plugin } from 'esbuild';
import { EspackPlugin } from '../build/build.plugin';
import { IBuilds, IEntryAsset, IEntryAssetTransformations, ImportFormat, Platforms, IBuild } from '../build/build.model';

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

const outExtensionShema: Joi.ObjectSchema<Record<string, string>> = Joi.object<Record<string, string>>({}).pattern(
    Joi.string(),
    Joi.string()
);

const esbuildPluginSchema: Joi.ObjectSchema<Plugin> = Joi.object<Plugin>({
    name: Joi.string(),
    setup: Joi.function().arity(1)
});

const espackPluginSchema: Joi.ObjectSchema<EspackPlugin> = Joi.object<EspackPlugin>({}).instance(EspackPlugin);
const espackPluginArrayShema: Joi.ArraySchema = Joi.array().items(espackPluginSchema);

const entryAssetTransformationSchema: Joi.ObjectSchema<IEntryAssetTransformations> = Joi.object<IEntryAssetTransformations>({
    sourcemap: Joi.boolean(),
    bundle: Joi.boolean(),
    platform: Joi.string().valid(...Object.values(Platforms)),
    format: Joi.string().valid(...Object.values(ImportFormat)),
    splitting: Joi.boolean(),
    define: environmentVariablesSchema,
    plugins: Joi.array().items(esbuildPluginSchema),
    preserveSymlinks: Joi.boolean(),
    absWorkingDir: Joi.string(),
    avoidTDZ: Joi.boolean(),
    charset: Joi.string().valid('ascii', 'utf8'),
    color: Joi.boolean(),
    errorLimit: Joi.number(),
    excludePeerDependencies: Joi.boolean(),
    external: JoiStringArray,
    globalName: Joi.string(),
    incremental: Joi.boolean(),
    jsxFactory: Joi.string(),
    jsxFragment: Joi.string(),
    keepNames: Joi.boolean(),
    loader: loaderSchema,
    logLevel: Joi.string().valid('info', 'warning', 'error', 'silent'),
    mainFields: JoiStringArray,
    minify: Joi.boolean(),
    minifyIdentifiers: Joi.boolean(),
    minifySyntax: Joi.boolean(),
    minifyWhitespace: Joi.boolean(),
    buildsDir: Joi.string(),
    resolveExtensions: Joi.string(),
    sourcesContent: Joi.boolean(),
    target: Joi.alternatives().try(Joi.string(), JoiStringArray),
    treeShaking: Joi.alternatives().try(Joi.boolean().allow(true), Joi.string().allow('ignore-annotations')),
    tsconfig: Joi.string(),
    assetNames: Joi.string(),
    footer: Joi.string(),
    banner: Joi.string(),
    outbase: Joi.string(),
    outdir: Joi.string(),
    nodePaths: JoiStringArray,
    outExtension: outExtensionShema,
    publicPath: Joi.string(),
    chunkNames: Joi.string(),
    inject: Joi.string(),
    pure: JoiStringArray
}).unknown(false);

const entryAssetTransformationRecordSchema: Joi.ObjectSchema<Record<string, IEntryAssetTransformations>> = Joi.object<
    Record<string, IEntryAssetTransformations>
>({}).pattern(Joi.string(), entryAssetTransformationSchema);

const entryAssetSchema: Joi.ObjectSchema<IEntryAsset> = Joi.object<IEntryAsset>({
    src: JoiRequiredString,
    buildProfiles: entryAssetTransformationRecordSchema
}).unknown(false);

const buildSchema: Joi.ObjectSchema<IBuild> = Joi.object<IBuild>({
    scripts: Joi.array().items(entryAssetSchema).required(),
    plugins: espackPluginArrayShema,
    buildProfiles: entryAssetTransformationRecordSchema
}).unknown(false);

export const buildsSchema: Joi.ObjectSchema<IBuilds> = Joi.object<IBuilds>({
    defaultBuildProfiles: entryAssetTransformationRecordSchema,
    defaultPlugins: espackPluginArrayShema,
    builds: Joi.array().items(buildSchema).required()
}).unknown(false);
