import fs, { FSWatcher } from 'fs';
import path from 'path';
import {
    BuildLifecycles,
    checkAssetsExist,
    EspackPlugin,
    getAssetFileName,
    IBasePluginContext,
    IBuildReadyPluginContext,
    IBuiltPluginContext,
    ICleanup
} from '@espack/espack';

interface IEspackCopyPluginOptions {
    assets: string[];
    outdir?: string;
}

type EspackDeterministicCopyPluginOptions = {
    [Key in keyof IEspackCopyPluginOptions]-?: Readonly<IEspackCopyPluginOptions[Key]>;
};
export class EspackCopyPlugin extends EspackPlugin<void> {
    private readonly _options: EspackDeterministicCopyPluginOptions;

    public constructor(options: IEspackCopyPluginOptions) {
        const enabledLifecycles: BuildLifecycles[] = [
            BuildLifecycles.RESOURCE_CHECK,
            BuildLifecycles.BUILD,
            BuildLifecycles.WATCH
        ];
        super('@espack/copy-plugin', enabledLifecycles);
        this._options = {
            outdir: 'assets',
            ...options
        };
    }

    private static _watcherFactory(
        context: IBuildReadyPluginContext | IBuiltPluginContext<void>,
        outdir: string,
        resource: string,
        onChange: (fileName: string) => void
    ): FSWatcher {
        const buildsDir: string = EspackPlugin.getBuildsDir(context);
        const watcher: FSWatcher = fs.watch(resource, { encoding: 'utf-8' }, (event, fileName) => {
            try {
                fs.unlinkSync(path.join(buildsDir, outdir, getAssetFileName(resource)));
                fs.copyFileSync(fileName, path.join(buildsDir, outdir, getAssetFileName(fileName)));
            } catch (e) {
                console.error(e);
            } finally {
                onChange(fileName);
                watcher.close();
            }
        });
        return watcher;
    }

    public onResourceCheck(context: IBasePluginContext): Promise<void> {
        return checkAssetsExist([...this._options.assets]);
    }

    public async onBuild(context: IBuildReadyPluginContext): Promise<void> {
        const buildsDir: string = EspackPlugin.getBuildsDir(context);
        const copyJobs: Promise<void>[] = this._options.assets.map(asset =>
            fs.promises.copyFile(asset, path.join(buildsDir, this._options.outdir, getAssetFileName(asset)))
        );
        await Promise.all(copyJobs);
    }

    public registerCustomWatcher(context: IBuiltPluginContext<void>): ICleanup {
        const watchedResources: string[] = [...this._options.assets];

        const watchers: FSWatcher[] = [];

        const createWatcher = (resource: string, index: number): FSWatcher => {
            return EspackCopyPlugin._watcherFactory(context, this._options.outdir, resource, fileName => {
                watchers.splice(index, 1, createWatcher(fileName, index));
                watchedResources.splice(index, 1, fileName);
            });
        };
        watchedResources.forEach(createWatcher);

        const close = (): void => {
            watchers.forEach(watcher => watcher.close());
        };

        return { stop: close };
    }
}
