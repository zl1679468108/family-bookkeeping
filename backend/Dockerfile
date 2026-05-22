# 使用多阶段构建，第一阶段用于编译构建
FROM node:20 AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm install

# 复制项目所有文件
COPY . .

# 执行生产环境构建
RUN npm run build:prod

# 第二阶段：运行阶段，只保留必要的运行时依赖
FROM node:20

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 只安装生产依赖
RUN npm install --production

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist ./dist

# 复制环境配置文件
COPY .env.development ./.env.development
COPY .env.production ./.env.production

# 暴露端口
EXPOSE 3000

# 根据 NODE_ENV 环境变量选择对应的配置文件并启动应用
# 使用方式：docker run -e NODE_ENV=production <image>
CMD ["sh", "-c", "cp .env.$NODE_ENV .env && node dist/main.js"]