import fs from 'fs';
import Vm from 'vm';
import { Builds, Cleanup } from './build/build.model';
import { builder } from './builder/builder';
import { getArgument } from './utils/get-argument';
import { buildsSchema } from './validation/build.validator';
import { isFile, FileExtensions } from './utils/is-file';
import { buildConfig } from './utils/build-config';

const timeLabel = 'Built under';
console.log('Starting build...');
console.time(timeLabel);

export const espack = async (): Promise<Cleanup[] | null> => {
    const profile = getArgument('profile');
    const watch = process.argv.includes('--watch');
    const config = getArgument('config');

    if (config && !isFile(config, FileExtensions.JAVASCRIPT, FileExtensions.TYPESCRIPT)) {
        throw new Error(`Config file must be a ${FileExtensions.TYPESCRIPT} or ${FileExtensions.JAVASCRIPT} file!`);
    }

    const configPaths = ['espack.config.ts', 'espack.config.js'];
    config && configPaths.unshift(config);
    const configPath = configPaths.find(path => fs.existsSync(path));
    if (!configPath) {
        throw new Error(
            'Could not find any configs! Provide either one of the following files:' +
                ` ${configPaths.join(' ')} or provide a config with the --config ./example/config.ts option.`
        );
    }

    const configString = buildConfig(configPath);

    type ConfigExports = { default?: Builds };
    const configExports: ConfigExports = {};
    Vm.runInNewContext(configString, {
        exports: configExports,
    });

    const espackConfig = configExports.default;
    if (!espackConfig) {
        throw new Error(`Missing default export from config ${configPath}!`);
    }

    const validation = buildsSchema.validate(espackConfig);
    if (validation.error) {
        console.error('The provided config is invalid!');
        console.error(validation.error);
        throw new Error('Could not validate config file!');
    }

    const buildResult = await Promise.all(
        espackConfig.builds.map(build =>
            builder(espackConfig.defaultBuildProfiles, espackConfig.defaultPlugins, build, watch, profile)
        )
    );

    return buildResult;
};

espack()
    .then(result => {
        result && result.forEach(cleanup => cleanup.stop);
        console.timeEnd(timeLabel);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
