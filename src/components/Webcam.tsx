/* eslint @typescript-eslint/no-unused-vars: 0 */

import React, {useEffect, useRef} from "react";
import styles from "./Webcam.module.scss";

export type WebcamProps = {
	/**
	 * The media stream constraints to use when accessing the webcam.
	 * See https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#constraints
	 */
	mediaStreamConstraints?: MediaStreamConstraints;
	/**
	 * The `loadeddata` event is fired when the first frame of the video has finished loading.
	 */
	onLoadedData?: (event: Event) => void;
};

export const Webcam: React.FC<WebcamProps> = ({
	mediaStreamConstraints = {
		video: {
			facingMode: "user",
			width: {ideal: 1280},
			height: {ideal: 720},
			aspectRatio: {ideal: 16 / 9},
			frameRate: {ideal: 60},
		},
	},
	onLoadedData,
}) => {
	// The `useRef` hook creates a reference to a DOM element.
	// We'll use this reference to access the current video element once its available.
	const videoRef = useRef<HTMLVideoElement | null>(null);

	// `useEffect` is a hook that runs after the first render of the component.
	// The callback function passed to useEffect is called after the component is mounted.
	// The second argument to useEffect is an array of dependencies.
	// If any of the dependencies change, the callback is called again.
	const dependencies = [mediaStreamConstraints, onLoadedData];
	useEffect(() => {
		// First we define and immediately invoke an async function to get the media stream.
		// It's not awaited because `useEffect` can't be an async function.
		// Besides, we don't want to block the rendering of the component.
		(async function getMedia() {
			try {
				// The `navigator.mediaDevices.getUserMedia` method prompts the user for permission
				// to use a media input which produces a MediaStream with tracks containing
				// the requested type of media (in this case, we'd like video from the webcam)
				const mediaStream = await navigator.mediaDevices.getUserMedia({
					...mediaStreamConstraints,
				});

				if (videoRef.current) {
					// We can use the `srcObject` property of the video element to set the
					// media stream as the source, effectively displaying the video from the webcam.
					videoRef.current.srcObject = mediaStream;

					// Set the `onLoadedData` event listener if provided. This will allow the parent
					// component to respond to the `loadeddata` event and use the video element's properties.
					if (onLoadedData) {
						videoRef.current.addEventListener("loadeddata", onLoadedData);
					}
				}
			} catch (err) {
				console.error("An error occurred accessing the webcam:", err);
			}
		})();

		return () => {
			// The return value of the `useEffect` callback function is a cleanup function
			// that stops the media stream when the component is unmounted.
			if (videoRef.current && videoRef.current.srcObject) {
				// We need to remove the event listener to avoid memory leaks.
				if (onLoadedData) {
					videoRef.current.removeEventListener("loadeddata", onLoadedData);
				}

				// Stop all tracks on the media stream.
				(videoRef.current.srcObject as MediaStream)
					.getTracks()
					.forEach((track) => track.stop());
			}
		};
	}, dependencies);

	// Finally, let's render the video element, making sure to set the `ref` attribute
	// to the `videoRef` we created earlier. This will allow us to access the video element
	// in the `useEffect` callback function.
	return (
		<>
			<video ref={videoRef} className={styles.webcam} autoPlay playsInline />
		</>
	);
};
