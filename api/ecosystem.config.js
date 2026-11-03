// ============================================================
// ecosystem.config.js
// Configuration of PM2, the process manager used in production:
// it keeps the API running, restarts it if it crashes and starts
// it again when the server reboots.
//   pm2 startOrReload ecosystem.config.js --env production
// ============================================================

module.exports = {
  apps: [
    {
      name: 'miaoutic-api',
      script: 'server.js',
      cwd: __dirname,
      // The secrets stay in api/.env (read by config/env.js)
      env_production: {
        NODE_ENV: 'production',
      },
      // Restart if a memory leak makes the API too big
      max_memory_restart: '200M',
      // Time given to the clean stop (end of requests, database
      // connections closed) before the process is killed
      kill_timeout: 5000,
      // Date and time in the logs (pm2 logs miaoutic-api)
      time: true,
    },
  ],
};
