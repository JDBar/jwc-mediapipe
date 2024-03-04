/*
 * This file contains a functional implementation of a Kalman filter
 * that can be used to smooth noisy data.
 */

export type GetKalmanFilterOptions = {
	processNoise: number;
	measurementNoise: number;
	estimatedError: number;
	initialValue: number;
};

/**
 * Returns a Kalman filter function that persists state between calls.
 */
export function getKalmanFilter(
	options: GetKalmanFilterOptions = {
		processNoise: 1e-2,
		measurementNoise: 1e-1,
		estimatedError: 1,
		initialValue: 0,
	},
) {
	type KalmanFilterState = {
		/** The initial value */
		x: number;
		/** Estimation error covariance */
		p: number;
		/** Process noise covariance */
		q: number;
		/** Measurement noise covariance */
		r: number;
		/** Kalman gain */
		k: number;
	};

	const state: KalmanFilterState = {
		x: options.initialValue,
		p: options.estimatedError,
		q: options.processNoise,
		r: options.measurementNoise,
		k: 0,
	};

	/**
	 * Performs Kalman filtering on the supplied `measurement`.
	 * The last computed state will persist between calls of this function.
	 */
	return function kalmanFilter(measurement: number) {
		// Prediction update
		state.p = state.p + state.q;

		// Measurement update
		state.k = state.p / (state.p + state.r);
		state.x = state.x + state.k * (measurement - state.x);
		state.p = (1 - state.k) * state.p;

		return state.x;
	};
}

export type KalmanFilter = ReturnType<typeof getKalmanFilter>;
