#!/usr/bin/env bash

# This script is used to copy the wasm/js assets from @mediapipe/tasks-vision to the public folder.
# The documentation says to resolve them from a CDN, but I think it's better to have them locally.
# Fortunately, they're already in the package, so we just need to copy them to the public folder.

# Check if the @mediapipe/tasks-vision package is installed
if [ ! -d "node_modules/@mediapipe/tasks-vision" ]; then
	echo "Error: @mediapipe/tasks-vision not found. Run 'npm install' first."
	exit 1
fi

# Copy the wasm and js files to the public folder
echo "Copying @mediapipe/tasks-vision wasm and js files to public/mediapipe/"
mkdir -p public/mediapipe
cp node_modules/@mediapipe/tasks-vision/wasm/*.wasm public/mediapipe/
cp node_modules/@mediapipe/tasks-vision/wasm/*.js public/mediapipe/

echo "Done!"
