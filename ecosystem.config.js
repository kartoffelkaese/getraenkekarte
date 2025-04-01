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
    }
  }]
}; 