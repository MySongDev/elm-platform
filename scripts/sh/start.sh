#!/bin/bash
# ============================================
# Elm Platform - 一键启动脚本
# 运行方式：bash scripts/sh/start.sh
# 适用：Linux / WSL(Ubuntu) / macOS
# ============================================

set -u

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }

# 切到仓库根目录
cd "$(dirname "$0")/../.."
ROOT_DIR="$(pwd)"

echo "=========================================="
echo "  Elm Platform 启动"
echo "=========================================="
echo ""

# ------------------------------------------
# 0. 环境前置检查
# ------------------------------------------
echo "=== 0. 环境检查 ==="

# docker
if ! command -v docker &>/dev/null; then
    error "未找到 docker，请先安装 Docker"
    exit 1
fi
if ! docker info &>/dev/null; then
    error "Docker 未运行，请先启动 Docker Desktop（WSL 用户：在 Windows 中启动 Docker Desktop）"
    exit 1
fi
info "Docker OK"

# pnpm
if ! command -v pnpm &>/dev/null; then
    error "未找到 pnpm，请执行：npm i -g pnpm"
    exit 1
fi
info "pnpm OK"

# pm2
if ! command -v pm2 &>/dev/null; then
    warn "未找到 pm2，将尝试用 npx 运行（首次会较慢）"
    PM2_CMD="npx --yes pm2"
else
    PM2_CMD="pm2"
fi

# 后端 .env
if [ ! -f apps/server/.env ]; then
    if [ -f apps/server/.env.example ]; then
        warn "apps/server/.env 不存在，正在从 .env.example 复制"
        cp apps/server/.env.example apps/server/.env
        info "已生成 apps/server/.env"
    else
        error "找不到 apps/server/.env.example，无法生成 .env"
        exit 1
    fi
fi
info ".env OK"

# ------------------------------------------
# 1. 启动 Docker 容器（PostgreSQL + Redis）
# ------------------------------------------
echo ""
echo "=== 1. 启动数据库 ==="

docker compose up -d

# 等待 PostgreSQL 就绪（最多 60s，给首次拉镜像留时间）
for i in $(seq 1 60); do
    if docker compose exec -T postgres pg_isready -U postgres -d elm_dev &>/dev/null; then
        info "PostgreSQL 就绪"
        break
    fi
    if [ $i -eq 60 ]; then
        error "PostgreSQL 启动超时，可运行：docker compose logs postgres 查看原因"
        exit 1
    fi
    sleep 1
done

# 等待 Redis 就绪
for i in $(seq 1 30); do
    if docker compose exec -T redis redis-cli ping &>/dev/null; then
        info "Redis 就绪"
        break
    fi
    if [ $i -eq 30 ]; then
        error "Redis 启动超时，可运行：docker compose logs redis 查看原因"
        exit 1
    fi
    sleep 1
done

# ------------------------------------------
# 2. 准备后端（依赖 + Prisma + dist）
# ------------------------------------------
echo ""
echo "=== 2. 准备后端 ==="

# 仅在缺失时安装依赖（首次或重置后）
if [ ! -d node_modules ] || [ ! -d apps/server/node_modules ]; then
    warn "首次启动，正在安装依赖（可能需要几分钟）..."
    pnpm install
else
    info "依赖已就绪"
fi

# 生成 Prisma Client（dist 模式下必备）
if [ ! -d apps/server/node_modules/.prisma/client ] || [ ! -d apps/server/node_modules/@prisma/client ]; then
    warn "生成 Prisma Client..."
    pnpm --filter @elm-platform/server run prisma:generate
else
    info "Prisma Client 已就绪"
fi

# 同步数据库结构（首次或 schema 变更后）
# 注意：生产环境请改用 prisma:migrate:prod
if [ "${SKIP_DB_PUSH:-0}" != "1" ]; then
    warn "同步数据库结构（prisma db push）..."
    pnpm --filter @elm-platform/server run prisma:db:push || warn "db push 失败，如已同步可忽略"
fi

# 编译后端（dist 缺失时）
if [ ! -f apps/server/dist/main.js ]; then
    warn "未找到 apps/server/dist/main.js，正在编译..."
    pnpm --filter @elm-platform/server run build
fi

if [ ! -f apps/server/dist/main.js ]; then
    error "后端编译失败，请到 apps/server 手动执行 pnpm run build 查看错误"
    exit 1
fi
info "后端构建产物 OK"

# ------------------------------------------
# 3. 启动后端（PM2）
# ------------------------------------------
echo ""
echo "=== 3. 启动后端 ==="

cd "$ROOT_DIR"
# 用 ecosystem 文件统一管理，便于 stop.sh 复用
if [ -f scripts/sh/ecosystem.config.cjs ]; then
    $PM2_CMD startOrReload scripts/sh/ecosystem.config.cjs 2>/dev/null || \
    $PM2_CMD start scripts/sh/ecosystem.config.cjs
else
    $PM2_CMD start apps/server/dist/main.js --name elm-server --cwd "$ROOT_DIR" 2>/dev/null || \
    $PM2_CMD restart elm-server
fi

# 等待后端就绪：探活 /api-docs，最多 60s
HEALTHY=0
for i in $(seq 1 60); do
    CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api-docs || echo "000")
    if [ "$CODE" = "200" ] || [ "$CODE" = "301" ] || [ "$CODE" = "302" ]; then
        info "后端服务就绪 (http://localhost:3000)"
        HEALTHY=1
        break
    fi
    if [ $i -eq 60 ]; then
        error "后端启动超时（最后一次 HTTP 状态：$CODE）"
        warn "正在输出 PM2 日志帮助你定位："
        echo "----------------------------------------"
        $PM2_CMD logs elm-server --lines 60 --nostream --raw 2>/dev/null || $PM2_CMD logs --lines 60 --nostream
        echo "----------------------------------------"
        warn "常见原因："
        echo "  1) DATABASE_URL / REDIS_HOST 与 docker compose 不一致"
        echo "  2) PostgreSQL/Redis 端口被本机其他进程占用"
        echo "  3) apps/server/.env 未正确生成"
        echo "  4) Prisma Client 未生成（已在上一步处理）"
        exit 1
    fi
    sleep 1
done

# ------------------------------------------
# 4. 检查 Nginx
# ------------------------------------------
echo ""
echo "=== 4. 检查 Nginx ==="

if command -v nginx &>/dev/null; then
    if sudo nginx -t &>/dev/null; then
        sudo systemctl start nginx 2>/dev/null || sudo nginx 2>/dev/null || true
        info "Nginx 运行中 (http://localhost)"
    else
        warn "Nginx 配置有误，请运行 sudo nginx -t 查看"
    fi
else
    warn "未安装 nginx，跳过（仅影响前端本地 80 端口访问，可直接用各自 dev 端口）"
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
echo "  API 文档:  http://localhost:3000/api-docs"
echo ""
echo "  账号:  admin / admin123"
echo ""
echo "  停止命令:  bash scripts/sh/stop.sh"
echo "  状态查询:  bash scripts/sh/status.sh"
echo "  PM2 日志:  pm2 logs elm-server"
echo ""