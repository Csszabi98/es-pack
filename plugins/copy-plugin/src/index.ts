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

    private static _watcherFactory(resource: string, onChange: (fileName: string) => void): FSWatcher {
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

        const createWatcher = (resource: string, index: number): FSWatcher =>
            EspackCopyPlugin._watcherFactory(resource, fileName => {
                const label: string = `[watch] ${this.name} build finished under`;
                console.time(label);
                console.log(`[watch] ${this.name} build started...`);
                fs.copyFileSync(resource, path.join(context.buildsDir, this._options.outdir, path.basename(fileName)));
                console.timeEnd(label);
            });
        const watchers: FSWatcher[] = watchedResources.map(createWatcher);

        const close = (): void => {
            watchers.forEach(watcher => watcher.close());
        };

        return { stop: close };
    }
}
