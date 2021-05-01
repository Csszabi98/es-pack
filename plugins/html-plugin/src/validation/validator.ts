import Joi from 'joi';
import { IEspackHtmlPluginOptions, IHtmlInjection } from '../html-plugin';

const stringRecordSchema: Joi.ObjectSchema<Record<string, string>> = Joi.object<Record<string, string>>({}).pattern(
    Joi.string(),
    Joi.string()
);

const htmlInjectionSchema: Joi.ObjectSchema<IHtmlInjection> = Joi.object<IHtmlInjection>({
    afterHeadStart: Joi.string(),
    beforeHeadEnd: Joi.string(),
    afterBodyStart: Joi.string(),
    beforeBodyEnd: Joi.string()
}).unknown(false);

export const htmlPluginOptionsSchema: Joi.ObjectSchema<IEspackHtmlPluginOptions> = Joi.object<IEspackHtmlPluginOptions>({
    outputFile: Joi.string(),
    injectionSeparator: Joi.string(),
    injectionPrefix: Joi.string(),
    define: stringRecordSchema,
    inputFile: Joi.string(),
    inject: Joi.array().items(Joi.string()),
    injectStyle: Joi.array().items(Joi.string()),
    injectHtml: htmlInjectionSchema,
    minify: Joi.alternatives().try(Joi.boolean(), Joi.object().unknown(true)), // Pass on option validation to html-minifier
    hashSeparator: Joi.string()
}).unknown(false);
