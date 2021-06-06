import { BuildProfile, DefaultBuildProfiles, ImportFormat, Platforms } from '../model';

const defaultEntryAssetTransformations: BuildProfile = {
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
    outdir: '',
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.css', '.json'],
    sourcesContent: false,
    target: ['chrome58', 'firefox57', 'safari11', 'edge60', 'node12.9.0'],
    treeShaking: true,
    assetNames: 'assets/[name]-[hash]',
    platform: Platforms.NEUTRAL
};

export const DEFAULT_ENTRY_ASSET_TRANSFORMATIONS: Record<DefaultBuildProfiles, BuildProfile> = {
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
