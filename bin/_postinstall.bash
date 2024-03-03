#!/usr/bin/env bash

# This runs during npm's postinstall lifecycle event.
# Basically, anything you want to run after running npm install.

./bin/copy_mediapipe_wasm.bash
