import { buildSync } from 'esbuild';
import { ImportFormat } from '../build/build.model';

export const buildConfig = (configPath: string): string =>
    buildSync({
        entryPoints: [configPath],
        target: ['node12.9.0'],
        format: ImportFormat.COMMON_JS,
        loader: {
            '.ts': 'ts',
            '.js': 'js',
        },
        bundle: true,
        write: false,
    }).outputFiles[0].text;
