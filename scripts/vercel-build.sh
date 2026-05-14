#!/usr/bin/env bash
set -e
mkdir -p public/docs
cp frontend/index.html public/index.html
cp frontend/app.js public/app.js
cp frontend/style.css public/style.css
cp frontend/manifest.json public/manifest.json
cp docs/flag.png public/docs/flag.png
cp docs/homepage.png public/docs/homepage.png
