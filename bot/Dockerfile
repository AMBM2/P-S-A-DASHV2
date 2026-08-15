FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY bot ./bot
COPY ecosystem.config.cjs ./

EXPOSE 4000

# Run via PM2 so the bot auto-restarts if it crashes or on reboot
RUN npm install -g pm2
CMD ["pm2-runtime", "start", "ecosystem.config.cjs", "--only", "psa-discord-bot"]
