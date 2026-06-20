#!/bin/bash
# ============================================
# Elm Platform - 一键停止脚本
# 运行方式：bash scripts/sh/stop.sh
# ============================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
info() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

cd "$(dirname "$0")/../.."

echo "=========================================="
echo "  Elm Platform 停止"
echo "=========================================="
echo ""

# PM2 可能未安装或未在 PATH
if command -v pm2 &>/dev/null; then
    pm2 stop elm-server 2>/dev/null && info "后端已停止" || warn "后端未运行"
    pm2 delete elm-server 2>/dev/null || true
else
    warn "未找到 pm2，跳过后端停止"
fi

# Nginx
if command -v nginx &>/dev/null; then
    sudo systemctl stop nginx 2>/dev/null \
        || sudo nginx -s stop 2>/dev/null \
        || warn "Nginx 未运行"
    info "Nginx 已停止"
else
    warn "未安装 nginx，跳过"
fi

# Docker
if command -v docker &>/dev/null && docker info &>/dev/null; then
    docker compose down 2>/dev/null && info "Docker 容器已停止" || warn "Docker 容器未运行"
else
    warn "Docker 不可用，跳过"
fi

echo ""
echo "  全部停止完成"
echo ""