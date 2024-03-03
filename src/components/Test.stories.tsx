import React from "react";
import {StoryObj, Meta} from "@storybook/react";
import {Test} from "./Test.tsx";

const meta: Meta<typeof Test> = {
	title: "Test",
	component: Test,
};

export default meta;
type Story = StoryObj<typeof Test>;

export const Primary: Story = {
	render: () => <Test />,
};
