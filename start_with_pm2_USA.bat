@echo off
title Rusty Hearts API (Usa Server)
cmd /k "npx pm2 start ecosystem.config.cjs --only rh-api-usa && npx pm2 logs rh-api"
pause