import fs from 'fs';
import { minify as transformHtml } from 'html-minifier';
import { BUILD_ENCODING } from '../build/build.constants';
import { getOutputAsset } from '../utils/asset.utils';

export const loadHtml = (htmlAsset: string, minify: boolean): Promise<string> =>
    new Promise((resolve, reject) => {
        fs.readFile(htmlAsset, BUILD_ENCODING, async (err, data) => {
            if (err) {
                return reject(err);
            }

            let result = data.toString();
            if (minify) {
                result = transformHtml(result, {
                    removeComments: true,
                    collapseWhitespace: true,
                });
            }

            return resolve(result);
        });
    });

export const injectAndWriteHtml = (
    htmlName: string,
    html: string,
    outdir: string,
    scripts: string[],
    styles: string[]
): Promise<void> => {
    let bundledHtml = html;
    bundledHtml = bundledHtml.replace(
        '</head>',
        `${styles.map(style => `<link rel="stylesheet" href="${style}.css">`).join('')}</head>`
    );
    bundledHtml = bundledHtml.replace(
        '</body>',
        `${scripts.map(script => `<script src="${script}.js"></script>`).join('')}</body>`
    );

    // TODO: Add build hashes
    return fs.promises.writeFile(getOutputAsset(htmlName, outdir), bundledHtml, {
        encoding: BUILD_ENCODING,
    });
};
