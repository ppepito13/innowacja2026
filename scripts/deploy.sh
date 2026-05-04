#!/bin/bash

set -e

APP_NAME="innowacja2026"
PORT=3000

echo "Rozpoczęto procedurę wdrożenia..."

git pull origin develop

npm install --legacy-peer-deps

npm run build

if pm2 list | grep -q "$APP_NAME"; then
  pm2 restart "$APP_NAME"
else
  pm2 serve build/ $PORT --name "$APP_NAME" --spa
fi

echo "Wdrożenie zakończone pomyślnie. Aplikacja działa na porcie $PORT."
