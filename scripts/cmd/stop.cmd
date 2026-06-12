@echo off
chcp 65001 >nul
title Elm Platform - 停止中...

echo ==========================================
echo   Elm Platform 停止
echo ==========================================
echo.

echo [1/3] 停止后端...
wsl -d Ubuntu -- bash -c "pm2 stop elm-server 2>/dev/null && echo '[✓] 后端已停止' || echo '[!] 后端未运行'"
echo.

echo [2/3] 停止 Nginx...
wsl -d Ubuntu -- bash -c "sudo systemctl stop nginx 2>/dev/null && echo '[✓] Nginx 已停止' || echo '[!] Nginx 未运行'"
echo.

echo [3/3] 停止 Docker 容器...
wsl -d Ubuntu -- bash -c "cd '/mnt/d/Desktop/笔记/项目/elm-master' && docker compose down && echo '[✓] Docker 容器已停止'"
echo.

echo ==========================================
echo   全部停止完成
echo ==========================================
echo.
pause
