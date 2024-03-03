import type {Preview, Parameters} from "@storybook/react";

// Add global styles
import "../src/styles/global.scss";

const preview: Preview = {
	parameters: {
		actions: {argTypesRegex: "^on[A-Z].*"},
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};

export const parameters: Parameters = {
	layout: "fullscreen",
};

export default preview;
