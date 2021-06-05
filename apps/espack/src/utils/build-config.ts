import { build, PluginBuild } from 'esbuild';
import { IEspackBuilds, ImportFormat, Platforms } from '../model';
import { NodeVM } from 'vm2';

const compileConfig = async (configPath: string): Promise<string> =>
    (
        await build({
            entryPoints: [configPath],
            target: ['node12.9.0'],
            platform: Platforms.NODE,
            format: ImportFormat.COMMON_JS,
            loader: {
                '.ts': 'ts',
                '.js': 'js'
            },
            bundle: true,
            plugins: [
                {
                    name: 'make-all-packages-external',
                    setup(build: PluginBuild) {
                        const filter: RegExp = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/; // Must not start with "/" or "./" or "../"
                        build.onResolve({ filter }, args => ({ path: args.path, external: true }));
                    }
                }
            ],
            write: false
        })
    ).outputFiles[0].text;

export const buildConfig = async (configPath: string): Promise<IEspackBuilds | undefined> => {
    try {
        const configString: string = await compileConfig(configPath);

        const vm: NodeVM = new NodeVM({
            require: {
                builtin: ['*'],
                external: true
            },
            env: process.env,
            sourceExtensions: ['js', 'ts', 'tsx', 'jsx', 'cjs', 'mjs']
        });

        return (vm.run(configString, configPath) || {}).default;
    } catch (e) {
        console.error(`Could not read ${configPath} file: ${e}`);
        throw e;
    }
};
