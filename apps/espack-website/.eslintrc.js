// This is a workaround for https://github.com/eslint/eslint/issues/3458
require('@rushstack/eslint-config/patch/modern-module-resolution');

module.exports = {
    extends: [
        '@rushstack/eslint-config/profile/node-trusted-tool',
        '@rushstack/eslint-config/mixins/friendly-locals',
        '@rushstack/eslint-config/mixins/react'
    ],
    parserOptions: { tsconfigRootDir: __dirname }
};
