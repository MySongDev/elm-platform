@echo off
chcp 65001 >nul
title Elm Platform - 状态检查

echo.
echo   Elm Platform 状态
echo   ─────────────────
echo.

wsl -d Ubuntu -- bash -c "
cd '/mnt/d/Desktop/笔记/项目/elm-master'

check() {
    if eval \"\$2\" >/dev/null 2>&1; then
        echo -e \"  [✓] \$1: 运行中\"
    else
        echo -e \"  [✗] \$1: 未运行\"
    fi
}

check 'PostgreSQL' 'docker compose exec -T postgres pg_isready -U postgres'
check 'Redis'      'docker compose exec -T redis redis-cli ping'
check 'NestJS'     'curl -s http://localhost:3000/api-docs'
check 'Nginx'      'curl -s -o /dev/null -w %{http_code} http://localhost/'
"

echo.
pause
