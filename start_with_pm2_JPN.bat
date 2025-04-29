@echo off
title Rusty Hearts API (Japan Server)
cmd /k "npx pm2 start ecosystem.config.cjs --only rh-api-jpn && npx pm2 logs rh-api"
pause