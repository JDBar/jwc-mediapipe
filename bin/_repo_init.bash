#!/usr/bin/env bash

# This bash script documents the commands used to set up this repo.
# You do not need to run this, it is just for reference.
#
# Line 1 is a shebang, which tells the shell what program to use to run this file.
# In this case, we are using bash.
#
# To execute this script, you can run `bash bin/_repo_init.bash` from the root of this repo.

# Create package.json
npm init -y

# Install runtime dependencies.
npm install \
	fastify@latest

# fastify is a web framework, which makes it easy to create a web server.
# It's included for this example project, but you can use any framework/libraries you want.

# Install development dependencies.
npm install --save-dev \
	typescript@latest \
	@types/node@20.9.0 \
	@typescript-eslint/eslint-plugin@latest \
	@typescript-eslint/parser@latest \
	eslint@latest \
	eslint-config-prettier@latest \
	eslint-plugin-prettier@latest \
	prettier@latest \
	pretty-quick@latest \
	tsx@latest \
	pkgroll

# eslint is a linter, which checks your code for errors.
# prettier is a code formatter, which makes your code look nice.
# tsx or "TypeScript Execute" makes it easy to run TypeScript files, especially with ES Modules.
# pkgroll is a dead-simple way to bundle your code into a single file.
