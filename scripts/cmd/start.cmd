@echo off
chcp 65001 >nul
title Elm Platform - 启动中...

echo ==========================================
echo   Elm Platform 启动
echo ==========================================
echo.

echo [1/4] 启动 Docker 容器...
wsl -d Ubuntu -- bash -c "cd '/mnt/d/Desktop/笔记/项目/elm-master' && docker compose up -d"
if errorlevel 1 (
    echo [✗] Docker 启动失败，请确保 Docker Desktop 已运行
    pause
    exit /b 1
)
echo [✓] Docker 容器已启动
echo.

echo [2/4] 启动后端服务...
wsl -d Ubuntu -- bash -c "cd '/mnt/d/Desktop/笔记/项目/elm-master' && pm2 start apps/server/dist/main.js --name elm-server --cwd . 2>/dev/null || pm2 restart elm-server"
echo [✓] 后端服务已启动
echo.

echo [3/4] 等待后端就绪...
wsl -d Ubuntu -- bash -c "for i in $(seq 1 30); do curl -s http://localhost:3000/api-docs >/dev/null 2>&1 && break; sleep 1; done"
echo [✓] 后端就绪
echo.

echo [4/4] 启动 Nginx...
wsl -d Ubuntu -- bash -c "sudo systemctl start nginx 2>/dev/null || sudo nginx"
echo [✓] Nginx 已启动
echo.

echo ==========================================
echo   全部启动完成！
echo ==========================================
echo.
echo   管理后台:  http://localhost/
echo   用户端:    http://localhost/user/
echo   API 文档:  http://localhost/api-docs
echo.
echo   账号:  admin / admin123
echo.
echo   关闭此窗口不影响服务运行
echo   停止服务请运行 stop.cmd
echo.
pause
