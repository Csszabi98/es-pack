import { IEspackPluginState, INJECTION_POINT_MAP, InjectionPoint } from '../html-plugin';

export const injectHtml = (html: string, options: IEspackPluginState): string => {
    const { injectHtml: injectableHtml, injectionSeparator } = options;
    if (!injectableHtml) {
        return html;
    }

    type DoInjection = (injectionPoint: InjectionPoint, injectableHtml: string) => void;
    const doInjection: DoInjection = (injectionPoint, injectableHtml) => {
        let replaceValue: string;
        if (injectionPoint === InjectionPoint.AFTER_HEAD_START || injectionPoint === InjectionPoint.AFTER_BODY_START) {
            replaceValue = `${injectionPoint}${injectionSeparator}${injectableHtml}`;
        } else {
            replaceValue = `${injectableHtml}${injectionSeparator}${injectionPoint}`;
        }
        html = html.replace(injectionPoint, replaceValue);
    };

    Object.keys(injectableHtml).forEach(key => {
        const htmlToInject: string | undefined = injectableHtml[key];
        if (htmlToInject) {
            doInjection(INJECTION_POINT_MAP[key], htmlToInject);
        }
    });

    return html;
};
