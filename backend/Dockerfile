# 构建阶段 - 使用官方 Node.js 镜像
FROM node:18 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:prod

# 运行阶段
FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist
COPY .env.production ./

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
