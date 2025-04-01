module.exports = {
  apps: [{
    name: 'getraenkekarte',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/getraenkekarte-error.log',
    out_file: '/var/log/pm2/getraenkekarte-out.log',
    time: true
  }]
} 