#!/bin/bash
# ============================================
# Elm Platform - Linux 一键部署脚本
# 运行方式：bash scripts/deploy-linux.sh
# ============================================

set -e

echo "=========================================="
echo "  Elm Platform 部署脚本"
echo "=========================================="

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ------------------------------------------
# 1. 安装 Node.js 22
# ------------------------------------------
echo ""
echo "=== 1. 安装 Node.js 22 ==="

if command -v node &> /dev/null; then
    NODE_VER=$(node --version)
    info "Node.js 已安装: $NODE_VER"
else
    info "正在安装 Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
    info "Node.js 安装完成: $(node --version)"
fi

# ------------------------------------------
# 2. 安装 pnpm
# ------------------------------------------
echo ""
echo "=== 2. 安装 pnpm ==="

if command -v pnpm &> /dev/null; then
    info "pnpm 已安装: $(pnpm --version)"
else
    info "正在安装 pnpm..."
    sudo npm install -g pnpm@11.5.0
    info "pnpm 安装完成: $(pnpm --version)"
fi

# ------------------------------------------
# 3. 安装 PM2
# ------------------------------------------
echo ""
echo "=== 3. 安装 PM2 ==="

if command -v pm2 &> /dev/null; then
    info "PM2 已安装: $(pm2 --version)"
else
    info "正在安装 PM2..."
    sudo npm install -g pm2
    info "PM2 安装完成"
fi

# ------------------------------------------
# 4. 安装 Nginx
# ------------------------------------------
echo ""
echo "=== 4. 安装 Nginx ==="

if command -v nginx &> /dev/null; then
    info "Nginx 已安装"
else
    info "正在安装 Nginx..."
    sudo apt install -y nginx
    info "Nginx 安装完成"
fi

# ------------------------------------------
# 5. 启动 PostgreSQL 和 Redis（Docker）
# ------------------------------------------
echo ""
echo "=== 5. 启动 PostgreSQL 和 Redis ==="

# 停止可能冲突的本地服务
sudo systemctl stop postgresql 2>/dev/null || true
sudo systemctl stop redis 2>/dev/null || true

# 使用项目自带的 docker-compose
cd "$(dirname "$0")/../.."

info "启动 Docker 容器..."
docker rm -f elm-postgres elm-redis 2>/dev/null || true
docker compose up -d

# 等待 PostgreSQL 就绪
info "等待 PostgreSQL 就绪..."
for i in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U postgres &>/dev/null; then
        info "PostgreSQL 就绪"
        break
    fi
    sleep 1
done

# 等待 Redis 就绪
info "等待 Redis 就绪..."
for i in $(seq 1 15); do
    if docker compose exec -T redis redis-cli ping &>/dev/null; then
        info "Redis 就绪"
        break
    fi
    sleep 1
done

# ------------------------------------------
# 6. 安装项目依赖并构建
# ------------------------------------------
echo ""
echo "=== 6. 安装依赖并构建 ==="

info "清理旧的 node_modules（Windows 和 WSL 不兼容）..."
rm -rf node_modules apps/*/node_modules packages/*/node_modules

info "安装依赖..."
CI=true pnpm install --frozen-lockfile

info "构建共享包..."
pnpm build:packages

# ------------------------------------------
# 7. 配置后端环境变量
# ------------------------------------------
echo ""
echo "=== 7. 配置后端 ==="

ENV_FILE="apps/server/.env"
if [ ! -f "$ENV_FILE" ]; then
    info "创建后端环境变量文件..."
    cat > "$ENV_FILE" << 'EOF'
APP_PORT=3000
APP_PREFIX=api
NODE_ENV=production
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/elm_dev?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false
CUSTOMER_LOGIN_AUTO_REGISTER=true
SMS_PROVIDER=mock
SMS_MOCK_CODE=123456
SMS_CODE_TTL_SECONDS=300
SMS_COOLDOWN_SECONDS=60
SMS_DAILY_LIMIT=10
EOF
    info "环境变量文件已创建"
else
    info "环境变量文件已存在，跳过"
fi

# ------------------------------------------
# 8. 数据库迁移和种子数据
# ------------------------------------------
echo ""
echo "=== 8. 初始化数据库 ==="

cd apps/server

info "生成 Prisma 客户端..."
npx prisma generate

info "执行数据库迁移..."
npx prisma migrate deploy

info "导入种子数据..."
npx prisma db seed || warn "种子数据导入失败（可能已存在）"

info "构建后端..."
npx nest build

cd ../..

# ------------------------------------------
# 9. 启动后端（PM2）
# ------------------------------------------
echo ""
echo "=== 9. 启动后端服务 ==="

# 停止旧进程
pm2 delete elm-server 2>/dev/null || true

info "启动 NestJS..."
pm2 start apps/server/dist/main.js --name elm-server --cwd "$(pwd)"

# 等待后端启动
info "等待后端启动..."
for i in $(seq 1 30); do
    if curl -s http://localhost:3000/api-docs &>/dev/null; then
        info "后端启动成功"
        break
    fi
    sleep 1
done

# ------------------------------------------
# 10. 构建前端
# ------------------------------------------
echo ""
echo "=== 10. 构建前端 ==="

info "构建 admin（API 地址设为本地 /api）..."
VITE_API_BASE_URL=/api pnpm build:admin

info "构建 user（API 地址设为本地 /api）..."
VITE_API_BASE_URL=/api pnpm build:user

# ------------------------------------------
# 11. 部署前端到 Nginx
# ------------------------------------------
echo ""
echo "=== 11. 部署前端 ==="

sudo mkdir -p /var/www/elm/admin
sudo mkdir -p /var/www/elm/user

sudo cp -r apps/web-admin/dist/* /var/www/elm/admin/
sudo cp -r apps/web-user/dist/* /var/www/elm/user/

sudo chown -R www-data:www-data /var/www/elm

info "前端文件已部署"

# ------------------------------------------
# 12. 配置 Nginx
# ------------------------------------------
echo ""
echo "=== 12. 配置 Nginx ==="

NGINX_CONF="/etc/nginx/sites-available/elm"

sudo tee "$NGINX_CONF" > /dev/null << 'EOF'
server {
    listen 80;
    server_name localhost;

    # 管理后台
    location / {
        root /var/www/elm/admin;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 用户端
    location /user/ {
        alias /var/www/elm/user/;
        index index.html;
        try_files $uri $uri/ /user/index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Swagger 文档
    location /api-docs {
        proxy_pass http://127.0.0.1:3000/api-docs;
        proxy_set_header Host $host;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/elm;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
}
EOF

# 启用站点
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/elm
sudo rm -f /etc/nginx/sites-enabled/default

# 测试并重启
sudo nginx -t && sudo systemctl restart nginx
info "Nginx 配置完成"

# ------------------------------------------
# 完成
# ------------------------------------------
echo ""
echo "=========================================="
echo -e "${GREEN}  部署完成！${NC}"
echo "=========================================="
echo ""
echo "  管理后台:  http://localhost/"
echo "  用户端:    http://localhost/user/"
echo "  API 文档:  http://localhost/api-docs"
echo ""
echo "  默认账号:  admin / admin123"
echo ""
echo "  常用命令:"
echo "    pm2 status          查看后端状态"
echo "    pm2 logs            查看后端日志"
echo "    pm2 restart elm-server  重启后端"
echo "    sudo nginx -t       测试 Nginx 配置"
echo "    sudo systemctl restart nginx  重启 Nginx"
echo ""
