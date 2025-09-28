# ModelRun.io Makefile
# 模型运行参数生成与部署助手

.PHONY: help install dev build clean

# 默认目标
.DEFAULT_GOAL := help

# 工作目录
WEB_DIR = web

# 帮助信息
help: ## 显示帮助信息
	@echo "🚀 ModelRun.io - 模型运行参数生成与部署助手"
	@echo ""
	@echo "可用命令:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# 检查环境
check-env: ## 检查开发环境
	@echo "🔍 检查开发环境..."
	@command -v node >/dev/null 2>&1 || (echo "❌ 未找到 Node.js，请先安装 Node.js 18+" && exit 1)
	@command -v pnpm >/dev/null 2>&1 || (echo "❌ 未找到 pnpm，请先安装 pnpm" && echo "安装命令: npm install -g pnpm" && exit 1)
	@echo "✅ Node.js 版本: $$(node -v)"
	@echo "✅ pnpm 版本: $$(pnpm -v)"

# 安装依赖
install: check-env ## 安装项目依赖
	@echo "📦 安装依赖..."
	cd $(WEB_DIR) && pnpm install
	@echo "✅ 依赖安装完成"

# 开发服务器
dev: install ## 启动开发服务器
	@echo "🌐 启动开发服务器..."
	@echo "访问 http://localhost:3000 查看网站"
	@echo "按 Ctrl+C 停止服务器"
	cd $(WEB_DIR) && pnpm run dev

# 构建项目
build: install ## 构建生产版本并导出静态文件
	@echo "🔨 构建生产版本..."
	cd $(WEB_DIR) && pnpm run build
	@echo "📁 移动构建产物到根目录..."
	@if [ -d "$(WEB_DIR)/out" ]; then \
		cp -r $(WEB_DIR)/out/* . && \
		echo "✅ 静态文件已移动到根目录"; \
		rm -rf $(WEB_DIR)/out && \
		echo "🧹 已清理临时构建文件夹"; \
		rm -rf logo.png; \
	else \
		echo "❌ 未找到构建产物"; \
		exit 1; \
	fi
	@echo "✅ 构建完成"

# 清理缓存
clean: ## 清理构建缓存和依赖
	@echo "🧹 清理缓存..."
	cd $(WEB_DIR) && pnpm run clean
	@echo "🧹 清理根目录构建产物..."
	@rm -rf *.html *.js *.css *.json _next static