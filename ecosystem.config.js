module.exports = {
  apps: [{
    name: 'getraenkekarte',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '128M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: 'localhost'  // Erlaubt Verbindungen von allen Interfaces
    },
    error_file: 'logs/error.log',
    out_file: '/logs/out.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_restarts: 10,
    restart_delay: 4000,
    wait_ready: true,
    listen_timeout: 10000
  }]
} 