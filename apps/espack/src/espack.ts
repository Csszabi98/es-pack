import fs from 'fs';
import Vm from 'vm';
import { IBuilds, ICleanup } from './build/build.model';
import { builder } from './builder/builder';
import { getArgument } from './utils/get-argument';
import { buildsSchema } from './validation/build.validator';
import { FileExtensions, isFile } from './utils';
import { buildConfig } from './utils/build-config';
import Joi from 'joi';

const timeLabel: string = 'Built under';
console.log('Starting build...');
console.time(timeLabel);

export const espack = async (): Promise<ICleanup[] | undefined> => {
    const profile: string = getArgument('profile');
    const watch: boolean = process.argv.includes('--watch');
    const config: string = getArgument('config');

    if (config && !isFile(config, FileExtensions.JAVASCRIPT, FileExtensions.TYPESCRIPT)) {
        throw new Error(`Config file must be a ${FileExtensions.TYPESCRIPT} or ${FileExtensions.JAVASCRIPT} file!`);
    }

    const configPaths: string[] = ['espack.config.ts', 'espack.config.js'];
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

    const configString: string = buildConfig(configPath);

    interface IConfigExports {
        default?: IBuilds;
    }
    const configExports: IConfigExports = {};

    try {
        Vm.runInNewContext(configString, {
            exports: configExports,
            require
        });
    } catch (e) {
        console.error(`Could not read espack.config file: ${e}`);
        throw e;
    }

    const espackConfig: IBuilds | undefined = configExports.default;
    if (!espackConfig) {
        throw new Error(`Missing default export from config ${configPath}!`);
    }

    const validation: Joi.ValidationResult = buildsSchema.validate(espackConfig);
    if (validation.error) {
        console.error('The provided config is invalid!');
        console.error(validation.error);
        throw new Error('Could not validate config file!');
    }

    return Promise.all(
        espackConfig.builds.map(build =>
            builder(
                espackConfig.defaultBuildProfiles,
                espackConfig.defaultPlugins,
                build,
                watch,
                profile,
                espackConfig.builds.length === 1
            )
        )
    );
};

espack()
    .then(result => {
        if (result) {
            result.forEach(cleanup => cleanup.stop);
        }
        console.timeEnd(timeLabel);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
