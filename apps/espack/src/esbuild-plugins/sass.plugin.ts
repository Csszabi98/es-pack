import { Plugin, PluginBuild } from 'esbuild';
import sass from 'sass';
import path from 'path';

export const sassPlugin = (): Plugin => ({
    name: 'sass',
    setup(build: PluginBuild) {
        build.onResolve({ filter: /\.scss$/ }, args => ({
            path: path.resolve(args.resolveDir, args.path),
            namespace: 'sass'
        }));
        build.onLoad({ filter: /.*/, namespace: 'sass' }, args => {
            // renderSync is significantly faster than render
            const compiled = sass.renderSync({ file: args.path });
            return {
                contents: compiled.css.toString(),
                loader: 'css'
            };
        });
    }
});
