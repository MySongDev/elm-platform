#!/bin/bash
# ============================================
# Elm Platform - 状态检查脚本
# 运行方式：bash scripts/sh/status.sh
# ============================================

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check() {
    if eval "$2" &>/dev/null; then
        echo -e "  ${GREEN}●${NC} $1: 运行中"
    else
        echo -e "  ${RED}●${NC} $1: 未运行"
    fi
}

cd "$(dirname "$0")/../.."

echo ""
echo "  Elm Platform 状态"
echo "  ─────────────────"
check "PostgreSQL" "docker compose exec -T postgres pg_isready -U postgres"
check "Redis"      "docker compose exec -T redis redis-cli ping"
check "NestJS"     "curl -s http://localhost:3000/api-docs"
check "Nginx"      "curl -s -o /dev/null -w '%{http_code}' http://localhost/"
echo ""
