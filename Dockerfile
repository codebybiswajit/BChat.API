FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g pm2

COPY . .

EXPOSE 5000

CMD ["pm2-runtime", "start", "ecosystem.config.cjs", "--env", "production"]
