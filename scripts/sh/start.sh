#!/bin/bash
# ============================================
# Elm Platform - 一键启动脚本
# 运行方式：bash scripts/start.sh
# ============================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }

cd "$(dirname "$0")/../.."

echo "=========================================="
echo "  Elm Platform 启动"
echo "=========================================="
echo ""

# ------------------------------------------
# 1. 启动 Docker 容器（PostgreSQL + Redis）
# ------------------------------------------
echo "=== 1. 启动数据库 ==="

# 检查 Docker 是否运行
if ! docker info &>/dev/null; then
    error "Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi

docker compose up -d

# 等待 PostgreSQL 就绪
for i in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U postgres &>/dev/null; then
        info "PostgreSQL 就绪"
        break
    fi
    [ $i -eq 30 ] && error "PostgreSQL 启动超时" && exit 1
    sleep 1
done

# 等待 Redis 就绪
for i in $(seq 1 15); do
    if docker compose exec -T redis redis-cli ping &>/dev/null; then
        info "Redis 就绪"
        break
    fi
    [ $i -eq 15 ] && error "Redis 启动超时" && exit 1
    sleep 1
done

# ------------------------------------------
# 2. 启动后端（PM2）
# ------------------------------------------
echo ""
echo "=== 2. 启动后端 ==="

pm2 start apps/server/dist/main.js --name elm-server --cwd "$(pwd)" 2>/dev/null || pm2 restart elm-server

# 等待后端启动
for i in $(seq 1 30); do
    if curl -s http://localhost:3000/api-docs &>/dev/null; then
        info "后端服务就绪 (http://localhost:3000)"
        break
    fi
    [ $i -eq 30 ] && error "后端启动超时" && exit 1
    sleep 1
done

# ------------------------------------------
# 3. 检查 Nginx
# ------------------------------------------
echo ""
echo "=== 3. 检查 Nginx ==="

if sudo nginx -t &>/dev/null; then
    sudo systemctl start nginx 2>/dev/null || true
    info "Nginx 运行中 (http://localhost)"
else
    warn "Nginx 配置有误，请运行 sudo nginx -t 查看"
fi

# ------------------------------------------
# 完成
# ------------------------------------------
echo ""
echo "=========================================="
echo -e "${GREEN}  全部启动完成！${NC}"
echo "=========================================="
echo ""
echo "  管理后台:  http://localhost/"
echo "  用户端:    http://localhost/user/"
echo "  API 文档:  http://localhost/api-docs"
echo ""
echo "  账号:  admin / admin123"
echo ""
echo "  停止命令:  bash scripts/stop.sh"
echo ""
