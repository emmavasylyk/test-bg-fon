#!/bin/bash

# Remove old build dir
rm -rf ./build

# Clean node modules
rm -rf node_modules

# Build app
npm i
npm run build

# Remove non-used params.ini file
rm ./build/app/params.ini