import fs, { FSWatcher } from 'fs';
import path from 'path';
import {
    checkAssetsExist,
    IEspackPlugin,
    IBasePluginContext,
    IBuildReadyPluginContext,
    IBuiltPluginContext,
    ICleanup
} from '@es-pack/espack';
import Joi from 'joi';
import { copyPluginOptionsSchema } from './validation/validator';

export interface IEspackCopyPluginOptions {
    basedir?: string;
    assets: string[];
    outdir?: string;
}

type EspackDeterministicCopyPluginOptions = {
    [Key in keyof IEspackCopyPluginOptions]-?: Readonly<IEspackCopyPluginOptions[Key]>;
};

const pluginName: string = '@es-pack/copy-plugin';

const watcherFactory = (resource: string, onChange: (fileName: string) => void): FSWatcher => {
    return fs.watch(resource, { encoding: 'utf-8' }, (event, fileName) => {
        if (event === 'rename') {
            console.error(
                `Asset ${fileName} renamed! Please sync up the changes with the config and restart the watcher...`
            );
            process.exit(1);
            return;
        }
        onChange(fileName);
    });
};

export const espackCopyPluginFactory = (options: IEspackCopyPluginOptions): IEspackPlugin<void> => {
    const validation: Joi.ValidationResult = copyPluginOptionsSchema.validate(options);
    if (validation.error) {
        console.error(validation.error);
        throw new Error('Invalid constructor options!');
    }

    const deterministicOptions: EspackDeterministicCopyPluginOptions = {
        outdir: 'assets',
        basedir: '.',
        ...options
    };

    const mapBasedirToAsset = (asset: string): string => {
        return path.join(deterministicOptions.basedir, asset);
    };

    const onResourceCheck = (context: IBasePluginContext): Promise<void> => {
        return checkAssetsExist([...deterministicOptions.assets.map(mapBasedirToAsset)]);
    };

    const onBuild = async (context: IBuildReadyPluginContext): Promise<void> => {
        const assetsDir: string = path.join(context.buildsDir, deterministicOptions.outdir);
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir);
        }

        const copyJobs: Promise<void>[] = deterministicOptions.assets.map(asset =>
            fs.promises.copyFile(path.join(deterministicOptions.basedir, asset), path.join(assetsDir, path.basename(asset)))
        );
        await Promise.all(copyJobs);
    };

    const registerCustomWatcher = (context: IBuiltPluginContext<void>): ICleanup => {
        const watchedResources: string[] = [...deterministicOptions.assets.map(mapBasedirToAsset)];

        const createWatcher = (resource: string): FSWatcher =>
            watcherFactory(resource, fileName => {
                const label: string = `[watch] ${pluginName} build finished under`;
                console.time(label);
                console.log(`[watch] ${pluginName} build started...`);
                fs.copyFileSync(
                    resource,
                    path.join(context.buildsDir, deterministicOptions.outdir, path.basename(fileName))
                );
                console.timeEnd(label);
            });
        const watchers: FSWatcher[] = watchedResources.map(createWatcher);

        const close = (): void => {
            watchers.forEach(watcher => watcher.close());
        };

        return { stop: close };
    };

    return {
        name: pluginName,
        onResourceCheck,
        onBuild,
        registerCustomWatcher
    };
};
