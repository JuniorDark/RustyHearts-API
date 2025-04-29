@echo off
title Rusty Hearts API
cmd /k "npx pm2 start ecosystem.config.cjs --only rh-api-all && npx pm2 logs rh-api"
pause