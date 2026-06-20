// Elm Platform - PM2 进程配置
// 由 scripts/sh/start.sh 调用，scripts/sh/stop.sh 通过 pm2 stop elm-server 关闭
module.exports = {
  apps: [
    {
      name: 'elm-server',
      script: 'apps/server/dist/main.js',
      cwd: require('path').resolve(__dirname, '../..'),
      // 让 PM2 转发 .env、注入工作目录
      autorestart: true,
      restart_delay: 3000,
      max_memory_restart: '512M',
      // 日志落到 logs/，避免污染仓库根
      out_file: require('path').resolve(__dirname, '../../logs/elm-server.out.log'),
      error_file: require('path').resolve(__dirname, '../../logs/elm-server.err.log'),
      merge_logs: true,
      // 时间戳便于排查
      time: true,
      // 监听文件变更可选，dist 模式一般不需要；如需热更改成 watch: ['apps/server/dist']
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};