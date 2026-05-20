# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# 使用生产环境构建命令
RUN npm run build:prod

# 运行阶段
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist

# 复制环境变量文件
COPY .env.production ./

EXPOSE 3000

# 移除 PORT 的硬编码，使用 .env.production 中的值
ENV NODE_ENV=production

CMD ["node", "dist/main.js"]