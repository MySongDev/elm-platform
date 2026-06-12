#!/bin/bash
# ============================================
# Elm Platform - 一键停止脚本
# 运行方式：bash scripts/sh/stop.sh
# ============================================

GREEN='\033[0;32m'
NC='\033[0m'
info() { echo -e "${GREEN}[✓]${NC} $1"; }

cd "$(dirname "$0")/../.."

echo "=========================================="
echo "  Elm Platform 停止"
echo "=========================================="
echo ""

# 停止后端
pm2 stop elm-server 2>/dev/null && info "后端已停止" || info "后端未运行"

# 停止 Nginx
sudo systemctl stop nginx 2>/dev/null && info "Nginx 已停止" || info "Nginx 未运行"

# 停止 Docker 容器
docker compose down 2>/dev/null && info "Docker 容器已停止" || info "Docker 容器未运行"

echo ""
echo "  全部停止完成"
echo ""
