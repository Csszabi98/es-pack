import { BuildLifecycles, EspackPlugin } from '../build/build.plugin';

export const getPluginsForLifecycle = (plugins: EspackPlugin[], lifecycle: BuildLifecycles): EspackPlugin[] =>
    plugins.filter(plugin => plugin.hookEnabled(lifecycle));
