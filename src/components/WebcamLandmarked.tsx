import React, {useCallback, useEffect, useRef} from "react";
import {WebcamProps, Webcam} from "./Webcam.tsx";
import {
	getVideoPoseLandmarker,
	getVideoFaceLandmarker,
	PoseLandmarker,
	Landmark,
	FaceLandmarker,
	DrawingUtils,
	MEDIAPIPE,
} from "@/lib/MediaPipe.ts";

// Import SCSS module
import styles from "./WebcamLandmarked.module.scss";

/**
 * This is a type alias for a function that returns a function that applies post-processing to landmarks.
 * This allows you to use whatever post-processing you want, such as a Kalman filter or an EWMA filter.
 */
export type GetPostProcessingFn = () => (
	landmarks: Landmark[][],
) => Landmark[][];

/**
 * These are the props the `WebcamLandmarked` component accepts.
 * It looks a bit awkward because we need to accept a generic type for the `getLandmarkPostProcessingFn` prop.
 */
export type WebcamLandmarkedProps<
	TPostProcessingFn extends GetPostProcessingFn,
> = WebcamProps & {
	/**
	 * The `onResults` event is fired when the pose landmarking results are available.
	 */
	onResults?: (results: unknown) => void;

	/**
	 * The `getLandmarkPostProcessingFn` function is used to apply post-processing to the landmarks.
	 * `getLandmarkPostProcessingFn` should return a function that accepts and returns an array of landmark arrays.
	 * The returned function will be called with the landmarks detected in each video frame.
	 *
	 * The default value is the identity function, which means no post-processing is applied.
	 *
	 * @default () => x => x
	 */
	getLandmarkPostProcessingFn?: TPostProcessingFn;
};

/**
 * This is a factory function that returns a `WebcamLandmarked` component.
 * It's a factory function because it returns a new component each time it's called.
 * This is useful because it allows you to create multiple `WebcamLandmarked` components with different post-processing functions.
 *
 * If no post-processing function is provided, the default is the identity function, which means no post-processing is applied.
 *
 * @example
 * ```tsx
 * const WebcamLandmarked = createWebcamLandmarked();
 * return <WebcamLandmarked
 * 	getLandmarkPostProcessingFn={getLandmarkSmootherEWMA}
 * />
 * ```
 * @example
 * ```tsx
 * const WebcamLandmarked = createWebcamLandmarked();
 * return <WebcamLandmarked
 *		getLandmarkPostProcessingFn={() =>
 *			getLandmarkSmootherEWMA({strength: 0.5})
 *		}
 * />
 * ```
 */
export function createWebcamLandmarked<
	T extends GetPostProcessingFn,
>(): React.FC<WebcamLandmarkedProps<T>> {
	const WebcamLandmarked: React.FC<WebcamLandmarkedProps<T>> = ({
		mediaStreamConstraints,
		onLoadedData,
		onResults,
		getLandmarkPostProcessingFn,
	}) => {
		const canvasRef = useRef<HTMLCanvasElement | null>(null); // A reference to the canvas element for drawing landmarks.
		const videoRef = useRef<HTMLVideoElement | null>(null); // A reference to the video element for getting the video frame.
		const requestAnimationFrameId = useRef<number | null>(null); // A reference to the requestAnimationFrame ID.
		const lastVideoTimeRef = useRef<number>(0); // A reference to the last observed video time.
		const poseLandmarkerRef = useRef<PoseLandmarker | null>(null); // A reference to the pose landmarker.
		const faceLandmarkerRef = useRef<FaceLandmarker | null>(null); // A reference to the face landmarker.
		const drawingUtilsRef = useRef<DrawingUtils | null>(null); // A reference to the drawing utilities.
		const processPoseLandmarks = getLandmarkPostProcessingFn // Apply post-processing to the pose landmarks.
			? getLandmarkPostProcessingFn()
			: (x: Landmark[][]) => x;
		const processFaceLandmarks = getLandmarkPostProcessingFn // Apply post-processing to the face landmarks.
			? getLandmarkPostProcessingFn()
			: (x: Landmark[][]) => x;

		/**
		 * These are needed during requestAnimationFrame loop to process each video frame.
		 * Storing them here to simplify the processVideoFrame function.
		 */
		const animationRefs = [
			videoRef,
			canvasRef,
			poseLandmarkerRef,
			faceLandmarkerRef,
			drawingUtilsRef,
		];

		// Initialize poseLandmarker and faceLandmarker when the component mounts
		// This is needed to detect landmarks in the video frames.
		useEffect(() => {
			(async function initPoseLandmarker() {
				poseLandmarkerRef.current = await getVideoPoseLandmarker({
					delegate: MEDIAPIPE.DELEGATE.GPU,
				});
				faceLandmarkerRef.current = await getVideoFaceLandmarker({
					delegate: MEDIAPIPE.DELEGATE.GPU,
				});
			})();
		}, []);

		// Initialize drawingUtils when the component mounts.
		// This is needed to draw the landmarks on the canvas.
		useEffect(() => {
			if (canvasRef.current) {
				const canvasCtx = canvasRef.current.getContext("2d");
				if (canvasCtx) {
					drawingUtilsRef.current = new DrawingUtils(canvasCtx);
				}
			}
		}, []);

		// Cleanup to stop the animation frame loop when the component eventually unmounts.
		useEffect(() => {
			return () => {
				if (requestAnimationFrameId.current) {
					cancelAnimationFrame(requestAnimationFrameId.current);
				}
			};
		}, []);

		// Set up a callback to process each video frame. This will initially be called by `onLoadedData`,
		// and then will be called for each subsequent frame via `requestAnimationFrame`.
		const processVideoFrame = useCallback(() => {
			// Schedule the next frame.
			requestAnimationFrameId.current =
				requestAnimationFrame(processVideoFrame);

			// If any of the required refs are not available, we can't do anything.
			for (const ref of animationRefs) {
				if (!ref.current) {
					return;
				}
			}

			// Note: The non-null assertion `!` is used here because we know the elements are available,
			// after having checked them in the previous loop.
			const video = videoRef.current!;
			const canvas = canvasRef.current!;
			const poseLandmarker = poseLandmarkerRef.current!;
			const faceLandmarker = faceLandmarkerRef.current!;
			const drawingUtils = drawingUtilsRef.current!;

			// If the video time hasn't changed, we don't need to process the frame.
			if (video.currentTime === lastVideoTimeRef.current) {
				return;
			}

			// Update the last observed video time.
			lastVideoTimeRef.current = video.currentTime;

			// Get the 2D rendering context for the canvas.
			const canvasCtx = canvas.getContext("2d");
			if (!canvasCtx) {
				return;
			}

			// Clear the canvas before drawing the new frame.
			canvasCtx.save();
			canvasCtx.clearRect(
				0,
				0,
				canvasCtx.canvas.width,
				canvasCtx.canvas.height,
			);
			canvasCtx.restore();

			// Run the pose landmark detection model on the current video frame.
			// This uses a callback to process the results, so it's a little more complicated than the face landmark detection.
			poseLandmarker.detectForVideo(
				video,
				video.currentTime * 1000, // Convert to milliseconds
				(poseLandmarkerResult) => {
					canvasCtx.save();

					// Apply any user-provided post-processing to the landmarks.
					const poseLandmarks = processPoseLandmarks(
						poseLandmarkerResult.landmarks,
					);

					// Draw all the landmarks and connections on the canvas.
					for (const landmark of poseLandmarks) {
						drawingUtils.drawLandmarks(landmark, {
							radius: (data) =>
								DrawingUtils.lerp(data.from?.z || 0, -0.15, 0.1, 5, 1),
							color: "#FFFFFF80",
							lineWidth: 2,
						});
						drawingUtils.drawConnectors(
							landmark,
							PoseLandmarker.POSE_CONNECTIONS,
							{color: "#FFFFFF80", lineWidth: 2},
						);
					}

					canvasCtx.restore();
				},
			);

			// Run the face landmark detection model on the current video frame.
			const faceLandmarkerResult = faceLandmarker.detectForVideo(
				video,
				video.currentTime * 1000, // Convert to milliseconds
			);

			canvasCtx.save();

			// Run user-provided `onResults` event listener if provided.
			if (onResults) {
				onResults(faceLandmarkerResult);
			}

			// Draw the face landmarks on the canvas.
			if (faceLandmarkerResult.faceLandmarks.length) {
				let {faceLandmarks} = faceLandmarkerResult;

				// Apply any user-provided post-processing to the landmarks.
				faceLandmarks = processFaceLandmarks(
					faceLandmarkerResult.faceLandmarks,
				);

				// Draw all the landmarks and connections on the canvas.
				for (const landmark of faceLandmarks) {
					// drawingUtils.drawConnectors(
					// 	landmark,
					// 	FaceLandmarker.FACE_LANDMARKS_TESSELATION,
					// 	{color: "#FFFFFF80", lineWidth: 1},
					// );
					drawingUtils.drawConnectors(
						landmark,
						FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
						{color: "#FF3030", lineWidth: 2},
					);
					drawingUtils.drawConnectors(
						landmark,
						FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
						{color: "#FF3030", lineWidth: 2},
					);
					drawingUtils.drawConnectors(
						landmark,
						FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
						{color: "#30FF30", lineWidth: 2},
					);
					drawingUtils.drawConnectors(
						landmark,
						FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
						{color: "#30FF30", lineWidth: 2},
					);
					drawingUtils.drawConnectors(
						landmark,
						FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
						{color: "#E0E0E0", lineWidth: 2},
					);
					drawingUtils.drawConnectors(
						landmark,
						FaceLandmarker.FACE_LANDMARKS_LIPS,
						{color: "#E0E0E0", lineWidth: 2},
					);
					drawingUtils.drawConnectors(
						landmark,
						FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
						{color: "#FF3030", lineWidth: 2},
					);
					drawingUtils.drawConnectors(
						landmark,
						FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
						{color: "#30FF30", lineWidth: 2},
					);
				}
			}

			canvasCtx.restore();
		}, [onResults, getLandmarkPostProcessingFn]); // If these dependencies change, the callback will be recreated.

		// `useCallback` is a hook that returns a cached callback function.
		// The callback function is only recreated if one of the dependencies changes.
		// This function is used to prepare the `onLoadedData` event listener, so that
		// we can store a reference to the video element and set the canvas size to match the video size,
		// as well as schedule the `processVideoFrame` loop via `requestAnimationFrame`.
		const onLoadedDataCallback = useCallback(
			async function prepareLoadedData(event: Event) {
				// Store a reference to the video element.
				const video = event.target as HTMLVideoElement;
				videoRef.current = video;

				// We need to make sure the canvas is the same size as the video.
				// So we wait for the video to load the first frame.
				const canvas = canvasRef.current;
				if (canvas) {
					canvas.width = video.videoWidth;
					canvas.height = video.videoHeight;
				}

				// Run user-provided `onLoadedData` event listener if provided.
				if (onLoadedData) {
					onLoadedData(event);
				}

				console.info("WebcamLandmarked: Starting processVideoFrame loop!");
				processVideoFrame();
			},
			[onLoadedData, processVideoFrame], // If these dependencies change, the callback will be recreated.
		);

		// Finally, let's render the `WebcamLandmarked` component.
		return (
			<div className={styles.wrapper}>
				<Webcam
					mediaStreamConstraints={mediaStreamConstraints}
					onLoadedData={onLoadedDataCallback}
				/>
				<canvas className={styles.canvas} ref={canvasRef} />
			</div>
		);
	};

	return WebcamLandmarked;
}
