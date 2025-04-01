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
      NODE_ENV: 'production'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}; 