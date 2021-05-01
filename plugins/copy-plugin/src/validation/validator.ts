import Joi from 'joi';
import { IEspackCopyPluginOptions } from '../';

export const copyPluginOptionsSchema: Joi.ObjectSchema<IEspackCopyPluginOptions> = Joi.object<IEspackCopyPluginOptions>({
    basedir: Joi.string(),
    assets: Joi.array().items(Joi.string()).required().min(1),
    outdir: Joi.string()
}).unknown(false);
