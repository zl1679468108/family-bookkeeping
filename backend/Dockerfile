# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:prod

# 运行阶段
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist

# 复制环境变量文件
COPY .env.production ./

# 暴露端口（必须与 .env.production 中的 PORT 一致）
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

CMD ["node", "dist/main.js"]