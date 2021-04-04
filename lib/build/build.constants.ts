import {
    DefaultBuildProfiles,
    DefaultEntryAssetTransformations,
    EntryAssetTransformations,
    ImportFormat,
    Platforms,
} from './build.model';

export const BUILD_ENCODING = 'utf-8';

export const ENTRY_POINT_NOT_EXISTS_ERROR_MESSAGE = 'Could not find the following entry points, check if all of them exist!';
export const NON_EXISTENT_ENTRY_POINTS_ANNOUNCEMENT_MESSAGE = 'The following entry points are non existent:';

const defaultEntryAssetTransformations: EntryAssetTransformations = {
    sourcemap: true,
    bundle: true,
    format: ImportFormat.IIFE,
    splitting: false,
    plugins: [],
    preserveSymlinks: false,
    absWorkingDir: process.cwd(),
    avoidTDZ: false,
    charset: 'utf8',
    color: true,
    define: {
        NODE_ENV: 'development',
    },
    errorLimit: 0,
    excludePeerDependencies: false,
    external: [],
    globalName: 'app',
    incremental: false,
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    keepNames: false,
    loader: {
        '.ts': 'ts',
        '.tsx': 'tsx',
        '.js': 'js',
        '.css': 'css',
    },
    logLevel: 'info',
    mainFields: ['module', 'main'],
    minify: false,
    minifyIdentifiers: false,
    minifySyntax: false,
    minifyWhitespace: false,
    buildsDir: 'dist',
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.css', '.json'],
    sourcesContent: false,
    target: ['chrome58', 'firefox57', 'safari11', 'edge16', 'node12.9.0'],
    treeShaking: true,
    tsconfig: 'tsconfig.json',
    assetNames: 'assets/[name]-[hash]',
    platform: Platforms.NEUTRAL,
};

export const DEFAULT_ENTRY_ASSET_TRANSFORMATIONS: DefaultEntryAssetTransformations = {
    [DefaultBuildProfiles.DEV]: {
        ...defaultEntryAssetTransformations,
    },
    [DefaultBuildProfiles.PROD]: {
        ...defaultEntryAssetTransformations,
        minify: false,
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
        sourcemap: false,
        define: {
            NODE_ENV: 'production',
        },
    },
} as const;