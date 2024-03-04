/*
 * This file provides an abstraction over the MediaPipe PoseLandmarker and FaceLandmarker.
 * It also provides utilities for smoothing the landmark data.
 */

import * as Vision from "@mediapipe/tasks-vision";
export {
	PoseLandmarker,
	PoseLandmarkerResult,
	Landmark,
	NormalizedLandmark,
	FaceLandmarker,
	DrawingUtils,
} from "@mediapipe/tasks-vision";
import {getKalmanFilter, KalmanFilter} from "./KalmanFilter.ts";

/**
 * A collection of MediaPipe-related constants.
 */
export const MEDIAPIPE = {
	/**
	 * The root path of the MediaPipe WASM files.
	 * This should map to the `public/mediapipe` directory in the project root,
	 * and is populated after running `npm install`.
	 */
	WASM_ROOT: "/mediapipe/",
	/** The paths to the MediaPipe task files. */
	POSE_LANDMARKER: {
		DEFAULT: "/assets/pose_landmarker_heavy.task",
		HEAVY: "/assets/pose_landmarker_heavy.task",
		LITE: "/assets/pose_landmarker_lite.task",
		FULL: "/assets/pose_landmarker_full.task",
	},
	FACE_LANDMARKER: {
		DEFAULT: "/assets/face_landmarker.task",
	},
	/** The running mode of the MediaPipe task. */
	RUNNING_MODE: {
		IMAGE: "IMAGE",
		VIDEO: "VIDEO",
	},
	/** The device to run the model on. */
	DELEGATE: {
		GPU: "GPU",
		CPU: "CPU",
	},
} as const;

export type GetVideoLandmarkerOptions = {
	/**
	 * The device to run the model on. The "CPU" device is the slowest but most compatible,
	 * the "GPU" device is the fastest but requires a compatible GPU.
	 * @default "GPU"
	 */
	delegate?: (typeof MEDIAPIPE.DELEGATE)[keyof typeof MEDIAPIPE.DELEGATE];
	/**
	 * The type of the model to use. The "HEAVY" model is the most accurate but slowest,
	 * the "LITE" model is the fastest but least accurate, and the "FULL" model is in between.
	 * @default "HEAVY"
	 */
	modelType?: keyof typeof MEDIAPIPE.POSE_LANDMARKER;
};

export type GetVideoPoseLandmarkerOptions = GetVideoLandmarkerOptions;

/**
 * Get a PoseLandmarker instance for video processing.
 */
export async function getVideoPoseLandmarker(
	options: GetVideoPoseLandmarkerOptions = {
		delegate: MEDIAPIPE.DELEGATE.GPU,
		modelType: "HEAVY",
	},
) {
	const delegate = options.delegate || MEDIAPIPE.DELEGATE.GPU;
	const modelAssetPath =
		MEDIAPIPE.POSE_LANDMARKER[options.modelType || "HEAVY"];

	return Vision.PoseLandmarker.createFromOptions(
		await Vision.FilesetResolver.forVisionTasks(MEDIAPIPE.WASM_ROOT),
		{
			runningMode: MEDIAPIPE.RUNNING_MODE.VIDEO,
			numPoses: 1,
			outputSegmentationMasks: false, // TODO: Turn this back on when Mediapipe fixes segmentation masks
			baseOptions: {
				modelAssetPath,
				delegate,
			},
		},
	);
}

export type GetVideoFaceLandmarkerOptions = GetVideoLandmarkerOptions;

/**
 * Get a FaceLandmarker instance for video processing.
 */
export async function getVideoFaceLandmarker(
	options: GetVideoFaceLandmarkerOptions = {
		delegate: MEDIAPIPE.DELEGATE.GPU,
	},
) {
	const delegate = options.delegate || MEDIAPIPE.DELEGATE.GPU;
	const modelAssetPath = MEDIAPIPE.FACE_LANDMARKER.DEFAULT;

	return Vision.FaceLandmarker.createFromOptions(
		await Vision.FilesetResolver.forVisionTasks(MEDIAPIPE.WASM_ROOT),
		{
			runningMode: MEDIAPIPE.RUNNING_MODE.VIDEO,
			numFaces: 1,
			baseOptions: {
				modelAssetPath,
				delegate,
			},
			minTrackingConfidence: 0.5,
			minFaceDetectionConfidence: 0.5,
			minFacePresenceConfidence: 0.5,
		},
	);
}

/**
 * Returns a `getSmoothedLandmarks()` function that persists averages
 * between calls of the function.
 */
export function getLandmarkSmootherEWMA(
	options: {
		/** A number [0.0 - 1.0), where 0.0 is no smoothing. */
		strength: number;
	} = {strength: 0.5},
) {
	// A Landmark is basically type = { x: number, y: number, z: number }
	type Landmark = Vision.Landmark | Vision.NormalizedLandmark;
	type Pose = Landmark[];
	type PoseLandmarkerResult = Pose[];

	/** This holds the last computed averages. */
	let averages: PoseLandmarkerResult = [];

	/**
	 * Performs an exponential weighted moving average on the supplied `landmarks`.
	 * The last computed averages will persist between calls of this function,
	 * unless the number of detected poses changes.
	 */
	return function getSmoothedLandmarksEWMA(
		/** The landmarks returned in PoseLandmarkerResult */
		landmarks: PoseLandmarkerResult,
	) {
		// const a = performance.now();

		// Base case: No landmarks to smooth.
		if (landmarks.length === 0) {
			return [];
		}

		const {strength: smoothing} = options;

		// Make sure `averages` is initialized and matches the size of `landmarks`.
		if (averages.length !== landmarks.length) {
			averages = landmarks.map((pose) =>
				pose.map((landmark) => ({...landmark})),
			);
		}

		/** This is where we'll put a copy of our averages for all poses. */
		const smoothedPoses: PoseLandmarkerResult = [];

		for (let pose_i = 0; pose_i < landmarks.length; pose_i++) {
			const pose = landmarks[pose_i];

			for (let landmark_i = 0; landmark_i < pose.length; landmark_i++) {
				const landmark = pose[landmark_i];
				const average = averages[pose_i][landmark_i];

				average.x = average.x * smoothing + landmark.x * (1 - smoothing);
				average.y = average.y * smoothing + landmark.y * (1 - smoothing);
				average.z = average.z * smoothing + landmark.z * (1 - smoothing);
			}

			smoothedPoses.push(averages[pose_i].map((landmark) => ({...landmark})));
		}

		// const b = performance.now();
		// console.info("getSmoothedLandmarks() took", b - a, "ms");

		return smoothedPoses;
	};
}

export type LandmarkSmootherEWMA = ReturnType<typeof getLandmarkSmootherEWMA>;

/**
 * Returns a `getSmoothedLandmarksKalman()` function that persists
 * the Kalman filter state between calls of the function.
 */
export function getLandmarkSmootherKalman(
	options: {
		/**
		 * Increasing `processNoise` makes the filter more responsive to changes in the input data,
		 * as it indicates that you expect more variability in the dynamics of the system itself.
		 * However, it can also make the filter output noisier.
		 *
		 * Decreasing `processNoise` makes the filter output smoother and less responsive to changes
		 * in the input data, under the assumption that the system dynamics are relatively stable.
		 *
		 * There's no fixed minimum or maximum, but it typically starts from near zero for very stable systems,
		 * up to values that represent the expected variance in the system's dynamics. The optimal range
		 * depends on the specific application and the scale of the measurements.
		 */
		processNoise: number;
		/**
		 * Increasing `measurementNoise` tells the filter that you have less confidence in the accuracy
		 * of your measurements, causing the filter to rely more on its model predictions rather than the
		 * noisy measurements, resulting in smoother outputs.
		 *
		 * Decreasing `measurementNoise` indicates higher confidence in the measurements, causing the filter
		 * to follow the measurements more closely, which can make the output more responsive but potentially noisier.
		 *
		 * the range is application-dependent. It should reflect the actual or estimated variance of the measurement
		 * noise. The values can range from near zero (for very precise measurements) to higher values that represent
		 * the expected noise level.
		 */
		measurementNoise: number;
		/**
		 * Increasing `estimatedError` suggests that the initial state estimate is uncertain, making the filter
		 * initially put more weight on the incoming measurements until it converges to a more stable estimate.
		 *
		 * Decreasing `estimatedError` indicates higher confidence in the initial state estimate, making the
		 * filter initially rely more on its model and less on the measurements.
		 *
		 * The initial value should reflect the confidence in your initial state estimate.
		 * It could start from a relatively small number if the initial estimate is believed to be accurate,
		 * to larger numbers reflecting greater initial uncertainty.
		 */
		estimatedError: number;
	} = {
		processNoise: 0.01,
		measurementNoise: 0.1,
		estimatedError: 1,
	},
) {
	const {processNoise, measurementNoise, estimatedError} = options;

	// A Landmark is basically type = { x: number, y: number, z: number }
	type Landmark = Vision.Landmark | Vision.NormalizedLandmark;
	type Pose = Landmark[];
	type PoseLandmarkerResult = Pose[];
	type KalmanFilter3D = {
		x: KalmanFilter;
		y: KalmanFilter;
		z: KalmanFilter;
	};

	/** This holds the last computed Kalman states. */
	let filters: KalmanFilter3D[][] = [];

	/**
	 * Performs an exponential weighted moving average on the supplied `landmarks`.
	 * The last computed averages will persist between calls of this function,
	 * unless the number of detected poses changes.
	 */
	return function getSmoothedLandmarksKalman(
		/** The landmarks returned in PoseLandmarkerResult */
		landmarks: PoseLandmarkerResult,
	) {
		// const a = performance.now();

		// Base case: No landmarks to smooth.
		if (landmarks.length === 0) {
			return [];
		}

		// Initialize filters if necessary
		if (filters.length !== landmarks.length) {
			const kalmanOptions = {
				processNoise,
				measurementNoise,
				estimatedError,
				initialValue: 0,
			};
			filters = landmarks.map((pose) =>
				pose.map(() => ({
					x: getKalmanFilter(kalmanOptions),
					y: getKalmanFilter(kalmanOptions),
					z: getKalmanFilter(kalmanOptions),
				})),
			);
		}

		/** This is where we'll put a copy of our averages for all poses. */
		const smoothedPoses: PoseLandmarkerResult = [];

		for (let pose_i = 0; pose_i < landmarks.length; pose_i++) {
			const pose = landmarks[pose_i];

			const smoothedPose: Pose = [];
			for (let landmark_i = 0; landmark_i < pose.length; landmark_i++) {
				const landmark = pose[landmark_i];
				const filter = filters[pose_i][landmark_i];

				const x = filter.x(landmark.x);
				const y = filter.y(landmark.y);
				const z = filter.z(landmark.z);

				smoothedPose.push({x, y, z});
			}

			smoothedPoses.push(smoothedPose);
		}

		// const b = performance.now();
		// console.info("getSmoothedLandmarksKalman() took", b - a, "ms");

		return smoothedPoses;
	};
}

export type LandmarkSmootherKalman = ReturnType<
	typeof getLandmarkSmootherKalman
>;
