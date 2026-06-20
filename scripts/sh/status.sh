#!/bin/bash
# ============================================
# Elm Platform - 状态检查脚本
# 运行方式：bash scripts/sh/status.sh
# ============================================

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check() {
    local label="$1"
    local cmd="$2"
    if eval "$cmd" &>/dev/null; then
        echo -e "  ${GREEN}●${NC} $label: 运行中"
    else
        echo -e "  ${RED}●${NC} $label: 未运行"
    fi
}

cd "$(dirname "$0")/../.."

echo ""
echo "  Elm Platform 状态"
echo "  ─────────────────"
check "PostgreSQL" "docker compose exec -T postgres pg_isready -U postgres"
check "Redis"      "docker compose exec -T redis redis-cli ping"
# /api-docs 首次会 301/302 重定向到 swagger-ui，200/301/302 都算健康
check "NestJS"     "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api-docs | grep -qE '^(200|301|302)$'"
check "Nginx"      "curl -s -o /dev/null -w '%{http_code}' http://localhost/ | grep -qE '^(200|301|302)$'"
echo ""
