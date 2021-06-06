import { IPluginHooks } from './plugin-lifecycles.model';

export interface IEspackPlugin<T = unknown> extends IPluginHooks<T> {
    readonly name: string;
}

export interface IEspackMarkedPlugin<T = unknown> extends IEspackPlugin<T> {
    id: symbol;
}

type RequiredField<T, Field extends keyof T> = {
    [P in keyof Pick<T, Field>]-?: NonNullable<T[P]>;
};

export type DeterministicEspackMarkedPlugin<Key extends keyof IPluginHooks<T>, T = unknown> = RequiredField<
    IEspackMarkedPlugin<T>,
    Key
> &
    Omit<IEspackMarkedPlugin<T>, Key>;
