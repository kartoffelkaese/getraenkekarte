module.exports = {
    apps : [{
      name: 'getraenkekarte',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '128M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Erweiterte Konfiguration für Stabilität
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }, {
      name: 'health-monitor',
      script: 'scripts/health-monitor.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }]
  }; 