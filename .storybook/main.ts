import type {StorybookConfig} from "@storybook/react-webpack5";
import path from "path";

const config: StorybookConfig = {
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [
		"@storybook/addon-links",
		"@storybook/addon-essentials",
		"@storybook/addon-onboarding",
		"@storybook/addon-interactions",
		"storybook-addon-sass-postcss",
	],
	framework: {
		name: "@storybook/react-webpack5",
		options: {
			builder: {
				useSWC: true,
			},
		},
	},
	docs: {
		autodocs: "tag",
	},
	staticDirs: ["../public"],
	typescript: {
		check: true,
	},
	webpackFinal: async (config) => {
		if (config.resolve) {
			config.resolve.alias = {
				...config.resolve.alias,
				"@": path.resolve(__dirname, "../src"),
			};
		}
		return config;
	},
};
export default config;
