import { IBasePluginContext, IBuildReadyPluginContext, IBuiltPluginContext } from './plugin-context.model';
import { ICleanup } from './cleanup.model';

export enum BuildLifecycles {
    BEFORE_RESOURCE_CHECK = 'beforeResourceCheck',
    RESOURCE_CHECK = 'onResourceCheck',
    AFTER_RESOURCE_CHECK = 'afterResourceCheck',
    BEFORE_BUILD = 'beforeBuild',
    BUILD = 'onBuild',
    AFTER_BUILD = 'afterBuild',
    AFTER_WRITE = 'afterWrite',
    WATCH = 'registerCustomWatcher',
    CLEANUP = 'onCleanup'
}

export interface IPluginHooks<T = unknown> {
    [BuildLifecycles.BEFORE_RESOURCE_CHECK]?: (context: IBasePluginContext) => void;
    [BuildLifecycles.RESOURCE_CHECK]?: (context: IBasePluginContext) => Promise<void>;
    [BuildLifecycles.AFTER_RESOURCE_CHECK]?: (context: IBasePluginContext) => void;
    [BuildLifecycles.BEFORE_BUILD]?: (context: IBuildReadyPluginContext) => void;
    [BuildLifecycles.BUILD]?: (context: IBuildReadyPluginContext) => Promise<T>;
    [BuildLifecycles.AFTER_BUILD]?: (context: IBuiltPluginContext<T>) => void;
    [BuildLifecycles.AFTER_WRITE]?: (context: IBuiltPluginContext<T>) => void;
    [BuildLifecycles.WATCH]?: (context: IBuiltPluginContext<T>) => ICleanup;
    [BuildLifecycles.CLEANUP]?: (context: IBuiltPluginContext<T>) => void;
}
