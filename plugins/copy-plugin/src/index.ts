import fs, { FSWatcher } from 'fs';
import path from 'path';
import {
    BuildLifecycles,
    checkAssetsExist,
    EspackPlugin,
    IBasePluginContext,
    IBuildReadyPluginContext,
    IBuiltPluginContext,
    ICleanup
} from '@espack/espack';

interface IEspackCopyPluginOptions {
    basedir?: string;
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
            basedir: '.',
            ...options
        };
    }

    private _mapBasedirToAsset(asset: string): string {
        return path.join(this._options.basedir, asset);
    }

    private static _watcherFactory(
        context: IBuildReadyPluginContext | IBuiltPluginContext<void>,
        outdir: string,
        resource: string,
        onChange: (fileName: string) => void
    ): FSWatcher {
        const { buildsDir } = context;
        const watcher: FSWatcher = fs.watch(resource, { encoding: 'utf-8' }, (event, fileName) => {
            try {
                fs.unlinkSync(path.join(buildsDir, outdir, path.basename(resource)));
                fs.copyFileSync(fileName, path.join(buildsDir, outdir, path.basename(fileName)));
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
        return checkAssetsExist([...this._options.assets.map(this._mapBasedirToAsset.bind(this))]);
    }

    public async onBuild(context: IBuildReadyPluginContext): Promise<void> {
        const assetsDir: string = path.join(context.buildsDir, this._options.outdir);
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir);
        }

        const copyJobs: Promise<void>[] = this._options.assets.map(asset =>
            fs.promises.copyFile(path.join(this._options.basedir, asset), path.join(assetsDir, path.basename(asset)))
        );
        await Promise.all(copyJobs);
    }

    public registerCustomWatcher(context: IBuiltPluginContext<void>): ICleanup {
        const watchedResources: string[] = [...this._options.assets.map(this._mapBasedirToAsset.bind(this))];

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
