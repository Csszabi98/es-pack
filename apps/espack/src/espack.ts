import fs from 'fs';
import { DefaultBuildProfiles, IEspackBuilds, ICleanup } from './model';
import { builder } from './builder/builder';
import { buildConfig, getArgument } from './utils';
import { buildsSchema } from './validation/build.validator';
import { FileExtensions, isFile } from './utils';
import Joi from 'joi';

interface IEspackResult {
    cleanup: ICleanup[];
    watch: boolean;
}

export const espack = async (): Promise<IEspackResult> => {
    const timeLabel: string = 'Built under';
    console.log('Starting build...');
    console.time(timeLabel);

    const profile: string = getArgument('profile') || DefaultBuildProfiles.PROD;
    process.env.NODE_ENV = profile;

    const watch: boolean = process.argv.includes('--watch');
    const config: string = getArgument('config');

    const configPaths: string[] = ['espack.config.ts', 'espack.config.js'];
    if (config && !isFile(config, FileExtensions.JAVASCRIPT, FileExtensions.TYPESCRIPT)) {
        throw new Error(`Config file must be a ${FileExtensions.TYPESCRIPT} or ${FileExtensions.JAVASCRIPT} file!`);
    }

    if (config) {
        configPaths.unshift(config);
    }

    const configPath: string | undefined = configPaths.find(path => fs.existsSync(path));
    if (!configPath) {
        throw new Error(
            'Could not find any configs! Provide either one of the following files:' +
                ` ${configPaths.join(' ')} or provide a config with the --config ./example/config.ts option.`
        );
    }

    const espackConfig: IEspackBuilds | undefined = await buildConfig(configPath);
    if (!espackConfig) {
        throw new Error(`Missing default export from config ${configPath}!`);
    }

    const validation: Joi.ValidationResult = buildsSchema.validate(espackConfig);
    if (validation.error) {
        console.error('The provided config is invalid!');
        console.error(validation.error);
        throw new Error('Could not validate config file!');
    }

    const cleanup: ICleanup[] = await Promise.all(
        espackConfig.builds.map(build =>
            builder({
                ...espackConfig,
                build,
                watch,
                buildProfile: profile,
                singleBuildMode: espackConfig.builds.length === 1
            })
        )
    );
    console.timeEnd(timeLabel);

    return {
        cleanup,
        watch
    };
};

espack()
    .then(result => {
        if (!result.watch) {
            result.cleanup.forEach(cleanup => cleanup.stop());
        }
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
