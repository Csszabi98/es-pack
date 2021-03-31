module.exports = {
	env: {
		es2021: true,
		node: true,
	},
	extends: ['standard', 'airbnb-base', 'plugin:eslint-plugin-import', 'prettier'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 12,
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint'],
	rules: {
		'import/prefer-default-export': 'off',
		'max-lines': ['error', 250],
		'max-len': ['error', { code: 125 }],
		'eol-last': ['error', 'always'],
	},
};