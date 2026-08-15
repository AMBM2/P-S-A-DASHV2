module.exports = {
  apps: [
    {
      name: "psa-discord-bot-v2",
      script: "./src/index.js",
      cwd: __dirname,
      interpreter: "node",
      watch: false,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
      env: { NODE_ENV: "production" },
    },
  ],
};
