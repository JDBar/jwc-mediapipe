#!/usr/bin/env bash

# This script will download the .task files for MediaPipe tasks and save them to the public/assets folder.

mkdir -p public/assets

downloaded_files=0

# Download the .task files
if [ ! -f public/assets/pose_landmarker_lite.task ]; then
	echo "Downloading pose_landmarker_lite.task to public/assets/"
	curl -# -o public/assets/pose_landmarker_lite.task https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task
	downloaded_files=$((downloaded_files+1))
fi

if [ ! -f public/assets/pose_landmarker_full.task ]; then
	echo "Downloading pose_landmarker_full.task to public/assets/"
	curl -# -o public/assets/pose_landmarker_full.task https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task
	downloaded_files=$((downloaded_files+1))
fi

if [ ! -f public/assets/pose_landmarker_heavy.task ]; then
	echo "Downloading pose_landmarker_heavy.task to public/assets/"
	curl -# -o public/assets/pose_landmarker_heavy.task https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task
	downloaded_files=$((downloaded_files+1))
fi

if [ ! -f public/assets/face_landmarker.task ]; then
	echo "Downloading face_landmarker.task to public/assets/"
	curl -# -o public/assets/face_landmarker.task https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
	downloaded_files=$((downloaded_files+1))
fi

# Print done if files were downloaded
if [ $downloaded_files -gt 0 ]; then
	echo "Done."
fi
