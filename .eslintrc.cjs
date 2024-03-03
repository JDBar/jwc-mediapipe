/**
 * ESLint lets you fix code style issues in your codebase.
 * I recommend using the ESLint extension for VSCode, which will highlight issues in your code as you type.
 *
 * The ESLint config is based on the recommended ruleset.
 * See documentation: https://typescript-eslint.io/getting-started/#step-2-configuration
 */

/* eslint-env node */
module.exports = {
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint"],
	root: true,
};
