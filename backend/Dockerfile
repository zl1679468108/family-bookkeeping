# 构建阶段
FROM node:20 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:prod

# 运行阶段
FROM node:20

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist
COPY .env.production ./

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "dist/main.js"]