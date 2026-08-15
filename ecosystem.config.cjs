module.exports = {
  apps: [
    {
      name: "psa-discord-bot",
      script: "./bot/bot.mjs",
      cwd: __dirname,
      interpreter: "node",
      watch: false,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
