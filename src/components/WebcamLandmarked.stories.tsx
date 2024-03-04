import React from "react";
import type {Meta, StoryObj} from "@storybook/react";
import {createWebcamLandmarked} from "./WebcamLandmarked.tsx";
import _ from "lodash";
import {
	getLandmarkSmootherEWMA,
	getLandmarkSmootherKalman,
} from "@/lib/MediaPipe.ts";

// return type of `createWebcamLandmarked`
type WebcamLandmarked = ReturnType<typeof createWebcamLandmarked>;
const meta: Meta<WebcamLandmarked> = {
	component: createWebcamLandmarked(),
};

export default meta;
type Story = StoryObj<WebcamLandmarked>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Primary: Story = {
	name: "No Smoothing",
	render: () => {
		const WebcamLandmarked = createWebcamLandmarked();

		return (
			<WebcamLandmarked
				onLoadedData={(e) => {
					console.log("WebcamLandmarked loaded data:", e);
				}}
				onResults={_.throttle((results) => {
					console.info("WebcamLandmarked results:", results);
				}, 1000)}
			/>
		);
	},
};

// EWMA Smoothing 0.5
export const Smoothing0_5: Story = {
	name: "EWMA Smoothing 0.5",
	render: () => {
		const WebcamLandmarked = createWebcamLandmarked();

		return (
			<WebcamLandmarked
				onLoadedData={(e: unknown) => {
					console.log("WebcamLandmarked loaded data:", e);
				}}
				onResults={_.throttle((results: unknown) => {
					console.info("WebcamLandmarked results:", results);
				}, 1000)}
				getLandmarkPostProcessingFn={() =>
					getLandmarkSmootherEWMA({strength: 0.5})
				}
			/>
		);
	},
};

// EWMA Smoothing 0.9
export const Smoothing0_9: Story = {
	name: "EWMA Smoothing 0.9",
	render: () => {
		const WebcamLandmarked = createWebcamLandmarked();

		return (
			<WebcamLandmarked
				onLoadedData={(e: unknown) => {
					console.log("WebcamLandmarked loaded data:", e);
				}}
				onResults={_.throttle((results: unknown) => {
					console.info("WebcamLandmarked results:", results);
				}, 1000)}
				getLandmarkPostProcessingFn={() =>
					getLandmarkSmootherEWMA({strength: 0.9})
				}
			/>
		);
	},
};

// Kalman Smoothing
export const Kalman: Story = {
	name: "Kalman Smoothing",
	render: () => {
		const WebcamLandmarked = createWebcamLandmarked();

		return (
			<WebcamLandmarked
				onLoadedData={(e: unknown) => {
					console.log("WebcamLandmarked loaded data:", e);
				}}
				onResults={_.throttle((results: unknown) => {
					console.info("WebcamLandmarked results:", results);
				}, 1000)}
				getLandmarkPostProcessingFn={() =>
					getLandmarkSmootherKalman({
						processNoise: 0.01,
						measurementNoise: 0.1,
						estimatedError: 1,
					})
				}
			/>
		);
	},
};
