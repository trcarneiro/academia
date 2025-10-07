/**
 * PM2 Process Manager Configuration
 * 
 * This file configures PM2 to run:
 * 1. Main application server (Fastify API)
 * 2. Google Ads sync cron job (every 6 hours)
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup  # Configure to start on boot
 * 
 * Management:
 *   pm2 list                    # View all processes
 *   pm2 logs                    # View logs
 *   pm2 restart all             # Restart all processes
 *   pm2 stop all                # Stop all processes
 *   pm2 delete all              # Remove all processes
 * 
 * @version 1.0.0
 */

module.exports = {
  apps: [
    // Main Application Server
    {
      name: 'academia-api',
      script: 'src/server.ts',
      interpreter: 'tsx',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    },

    // Google Ads Sync Cron Job
    {
      name: 'google-ads-sync',
      script: 'scripts/sync-google-ads.ts',
      interpreter: 'tsx',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 */6 * * *', // Every 6 hours (00:00, 06:00, 12:00, 18:00)
      autorestart: false, // Don't auto-restart, only run on cron schedule
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/google-ads-sync-error.log',
      out_file: './logs/google-ads-sync-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    }
  ]
};
