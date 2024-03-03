/**
 * Prettier lets you format your code automatically.
 * I recommend using the Prettier extension for VSCode, which will format your code as you type.
 * These options are personal preference, but I recommend them.
 */

/** @type {import("prettier").Config} */
const config = {
	useTabs: true, // Use tabs instead of spaces. This way, users on your team can set their own tab width.
	tabWidth: 2, // Set the default tab width to 2 spaces.
	semi: true, // Add semicolons at the end of statements.
	singleQuote: false, // Use double quotes instead of single quotes.
	bracketSpacing: false, // Whether to add spaces around brackets. { foo: bar } instead of {foo: bar}
};

module.exports = config;
