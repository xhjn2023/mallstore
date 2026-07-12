# CloudBase 云托管部署镜像
# 直接运行现有 Express 服务（server/server.ts），监听容器注入的 PORT。
FROM node:20-alpine

WORKDIR /app

# 先装依赖，利用镜像分层缓存
COPY package.json package-lock.json ./
RUN npm install

# 拷贝源码（node_modules / dist 等已由 .dockerignore 排除）
COPY . .

ENV NODE_ENV=production
# 云托管平台会注入实际端口并映射到外网，这里给一个兜底默认值
ENV PORT=3000

EXPOSE 3000

# 用 tsx 直接运行 TypeScript 入口（无需额外编译步骤）
CMD ["npx", "tsx", "server/server.ts"]
