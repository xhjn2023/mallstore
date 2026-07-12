#!/usr/bin/env bash
#
# 部署 mallstore 后端到腾讯云 CloudBase 云托管（CloudBase Run）
# 用法：bash scripts/deploy-cloudbase.sh
# 前置：npm i -g @cloudbase/cli && tcb login（浏览器扫码，仅一次）
#
set -e

# ---- 已确认的项目参数（无需修改）----
ENV_ID="xhjn-d7gfgxcvk06569b48"
SERVICE_NAME="mallstore-api"
PORT=3000
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> 项目根目录: $PROJECT_ROOT"
echo "==> 环境 ID   : $ENV_ID"
echo "==> 服务名    : $SERVICE_NAME"
echo "==> 容器端口  : $PORT"

cd "$PROJECT_ROOT"

# 检查 CLI 是否已安装
if ! command -v tcb >/dev/null 2>&1; then
  echo "[!] 未检测到 CloudBase CLI，正在全局安装..."
  npm i -g @cloudbase/cli
fi

# 检查是否已登录（未登录会打开浏览器扫码）
echo "==> 校验登录态..."
if ! tcb env list >/dev/null 2>&1; then
  echo "[*] 需要登录，打开浏览器扫码..."
  tcb login
fi

echo "==> 开始部署（自动识别 Dockerfile 构建镜像）..."
tcb cloudrun deploy \
  -e "$ENV_ID" \
  -s "$SERVICE_NAME" \
  --port "$PORT" \
  --source "$PROJECT_ROOT" \
  --force

echo ""
echo "==> 部署完成。请到 CloudBase 控制台 → 云托管 → 服务配置 → 访问设置 复制默认访问地址"
echo "    形如：https://$SERVICE_NAME-$ENV_ID.ap-shanghai.run.tcloudbase.com"
echo "    然后把该域名填进 miniprogram/config.js 的 CLOUDBASE_API_BASE，"
echo "    再到微信公众平台把该域名加入 request 合法域名，重新上传体验版即可。"
