/**
 * PM2 config - giữ backend chạy 24/7, tự khởi động lại khi lỗi hoặc reboot
 * Đặt tại: /var/www/app-quanly/backend/ecosystem.config.js
 * Chạy: pm2 start ecosystem.config.js && pm2 save
 */

module.exports = {
  apps: [
    {
      name: 'app-quanly-api',
      script: 'server.js',
      cwd: '/var/www/app-quanly/backend',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/app-quanly/error.log',
      out_file: '/var/log/app-quanly/out.log',
      time: true,
    },
  ],
};
