import { BuildLifecycles, DeterministicEspackPlugin, IEspackPlugin } from '../build/build.plugin';

export const getPluginsForLifecycle = <T extends BuildLifecycles>(
    plugins: IEspackPlugin[],
    lifecycle: T
): DeterministicEspackPlugin<T>[] =>
    (plugins.filter(plugin => plugin[lifecycle]) as unknown) as DeterministicEspackPlugin<T>[];
