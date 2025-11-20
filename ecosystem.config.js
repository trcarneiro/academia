/**
 * PM2 Ecosystem Configuration
 * Academia Krav Maga v2.0
 * 
 * Uso:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js --env production
 *   pm2 save
 * 
 * Management:
 *   pm2 list                    # View all processes
 *   pm2 logs academia           # View logs
 *   pm2 restart academia        # Restart app
 *   pm2 stop academia           # Stop app
 *   pm2 monit                   # Visual monitoring
 * 
 * @version 2.0.0
 */

module.exports = {
  apps: [
    // Main Application Server
    {
      name: 'academia',
      script: './dist/server.js',
      instances: 1, // Usar '1' para servidor small, 'max' para usar todos os cores
      exec_mode: 'fork', // 'cluster' para múltiplas instâncias
      
      // Restart behavior
      autorestart: true,
      watch: false, // NUNCA usar watch em produção
      max_memory_restart: '1G', // Reiniciar se ultrapassar 1GB de RAM
      
      // Environment variables
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0'
      },
      
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      
      // Logging
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true, // Prefixar logs com timestamp
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced features
      merge_logs: true, // Combinar logs de múltiplas instâncias
      min_uptime: '10s', // Considerar "online" após 10s
      max_restarts: 10, // Máximo de restarts em 1 minuto
      kill_timeout: 5000, // Aguardar 5s antes de forçar kill
      
      // Restart strategy
      restart_delay: 4000, // Aguardar 4s antes de reiniciar
      
      // Node.js specific
      node_args: [
        '-r', 'tsconfig-paths/register',
        '--max-old-space-size=1024' // Limitar heap size do V8 a 1GB
      ],
      
      // Cron restart (opcional - reiniciar diariamente às 3am)
      // cron_restart: '0 3 * * *',
      
      // Exponential backoff restart delay
      exp_backoff_restart_delay: 100,
    },

    // Google Ads Sync Cron Job (OPCIONAL)
    /*
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
    */
  ],
  
  // Deploy configuration (opcional - para PM2 deploy)
  deploy: {
    production: {
      user: 'root',
      host: '64.227.28.147',
      ref: 'origin/main',
      repo: 'git@github.com:trcarneiro/academia.git',
      path: '/var/www/academia',
      'post-deploy': 'npm install && npx prisma generate && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};

