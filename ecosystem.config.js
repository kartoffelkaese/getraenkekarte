module.exports = {
  apps: [{
    name: 'getraenkekarte',
    script: 'src/index.js',
    version: '2.4.1',
    max_memory_restart: '128M',
    exec_mode: 'cluster',
    instances: 1,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    wait_ready: true,
    listen_timeout: 50000,
    kill_timeout: 5000,
    merge_logs: true,
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
}; 