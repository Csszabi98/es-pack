import { DeterministicEspackMarkedPlugin, IEspackMarkedPlugin, IPluginHooks } from '../build/build.plugin';

export const getPluginsForLifecycle = <T extends keyof IPluginHooks>(
    plugins: readonly IEspackMarkedPlugin[],
    lifecycle: T
): DeterministicEspackMarkedPlugin<T>[] =>
    (plugins.filter(plugin => plugin[lifecycle]) as unknown) as DeterministicEspackMarkedPlugin<T>[];
