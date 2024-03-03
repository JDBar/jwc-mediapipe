import React from "react";
import type {Meta, StoryObj} from "@storybook/react";
import {Webcam} from "./Webcam.tsx";

const meta: Meta<typeof Webcam> = {
	component: Webcam,
};

export default meta;
type Story = StoryObj<typeof Webcam>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Primary: Story = {
	render: () => (
		<Webcam
			onLoadedData={(e) => {
				console.log("Webcam loaded data:", e);
			}}
		/>
	),
};
