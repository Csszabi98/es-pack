import {
    DefaultBuildProfiles,
    DefaultEntryAssetTransformations,
    IEntryAssetTransformations,
    ImportFormat,
    Platforms
} from './build.model';

export const BUILD_ENCODING: 'utf-8' = 'utf-8';

export const ENTRY_POINT_NOT_EXISTS_ERROR_MESSAGE: string =
    'Could not find the following entry points, check if all of them exist!';
export const NON_EXISTENT_ENTRY_POINTS_ANNOUNCEMENT_MESSAGE: string = 'The following entry points are non existent:';

const defaultEntryAssetTransformations: IEntryAssetTransformations = {
    sourcemap: true,
    bundle: true,
    format: ImportFormat.IIFE,
    splitting: false,
    plugins: [],
    preserveSymlinks: false,
    absWorkingDir: process.cwd(),
    charset: 'utf8',
    color: true,
    define: {
        NODE_ENV: 'development'
    },
    entryNames: '[dir]/[name]',
    sourceRoot: '',
    logLimit: 20,
    conditions: [],
    external: [],
    globalName: '',
    incremental: false,
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    keepNames: false,
    loader: {
        '.ts': 'ts',
        '.tsx': 'tsx',
        '.js': 'js',
        '.css': 'css'
    },
    logLevel: 'info',
    mainFields: ['module', 'main'],
    minify: false,
    minifyIdentifiers: false,
    minifySyntax: false,
    minifyWhitespace: false,
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.css', '.json'],
    sourcesContent: false,
    target: ['chrome58', 'firefox57', 'safari11', 'edge60', 'node12.9.0'],
    treeShaking: true,
    assetNames: 'assets/[name]-[hash]',
    platform: Platforms.NEUTRAL
};

export const DEFAULT_ENTRY_ASSET_TRANSFORMATIONS: DefaultEntryAssetTransformations = {
    [DefaultBuildProfiles.DEV]: {
        ...defaultEntryAssetTransformations
    },
    [DefaultBuildProfiles.PROD]: {
        ...defaultEntryAssetTransformations,
        minify: true,
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
        sourcemap: false,
        define: {
            NODE_ENV: 'production'
        }
    }
} as const;

export const DEFAULT_BUILDS_DIR: string = 'dist';
