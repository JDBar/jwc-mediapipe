#!/usr/bin/env bash

# This script will download the .task files for MediaPipe tasks and save them to the public/assets folder.

mkdir -p public/assets

downloaded_files=0

# Function to download a task file if it doesn't exist
download_task_file() {
	local task_file_name=$1
	local task_file_url=$2

	if [ ! -f "public/assets/$task_file_name" ]; then
		echo "Downloading $task_file_name to public/assets/"
		curl -# -o "public/assets/$task_file_name" "$task_file_url"
		downloaded_files=$((downloaded_files+1))
	fi
}

# Download the .task files
download_task_file "pose_landmarker_lite.task" "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
download_task_file "pose_landmarker_full.task" "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"
download_task_file "pose_landmarker_heavy.task" "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task"
download_task_file "face_landmarker.task" "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"

# Print done if files were downloaded
if [ $downloaded_files -gt 0 ]; then
	echo "Done."
fi
