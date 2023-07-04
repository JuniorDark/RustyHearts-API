@echo off
title API
cmd /k "npx pm2 start src/app.js --name rh-api && npx pm2 logs rh-api"
pause
