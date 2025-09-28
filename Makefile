# ModelRun.io Makefile
# 模型运行参数生成与部署助手

.PHONY: help install dev build start export clean lint type-check test

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
build: install ## 构建生产版本
	@echo "🔨 构建生产版本..."
	cd $(WEB_DIR) && pnpm run build
	@echo "✅ 构建完成"

# 启动生产服务器
start: build ## 启动生产服务器
	@echo "🚀 启动生产服务器..."
	cd $(WEB_DIR) && pnpm run start

# 导出静态文件
export: build ## 导出静态文件用于部署
	@echo "📦 导出静态文件..."
	cd $(WEB_DIR) && pnpm run export
	@echo "📁 移动构建产物到根目录..."
	@if [ -d "$(WEB_DIR)/out" ]; then \
		cp -r $(WEB_DIR)/out/* . && \
		echo "✅ 静态文件已移动到根目录"; \
	else \
		echo "❌ 未找到构建产物，请先运行 make build"; \
		exit 1; \
	fi

# 清理缓存
clean: ## 清理构建缓存和依赖
	@echo "🧹 清理缓存..."
	cd $(WEB_DIR) && pnpm run clean
	@echo "🧹 清理根目录构建产物..."
	@rm -rf *.html *.js *.css *.json _next static

# 代码检查
lint: ## 运行 ESLint 检查
	@echo "🔍 运行代码检查..."
	cd $(WEB_DIR) && pnpm run lint

# 类型检查
type-check: ## 运行 TypeScript 类型检查
	@echo "🔍 运行类型检查..."
	cd $(WEB_DIR) && pnpm run type-check

# 运行测试
test: ## 运行测试
	@echo "🧪 运行测试..."
	cd $(WEB_DIR) && pnpm run test

# 完整检查
check: lint type-check ## 运行完整的代码检查
	@echo "✅ 所有检查通过"

# 部署准备
deploy: clean install build export ## 准备部署文件
	@echo "🚀 部署准备完成"
	@echo "静态文件位于根目录"

# 快速启动（开发模式）
run: dev ## 快速启动开发服务器（别名）

# 快速构建
build-fast: ## 快速构建（跳过类型检查）
	@echo "⚡ 快速构建..."
	cd $(WEB_DIR) && pnpm run build

# 预览生产版本
preview: build ## 预览生产版本
	@echo "👀 预览生产版本..."
	cd $(WEB_DIR) && pnpm run preview

# 提交构建产物
commit-build: export ## 构建并提交构建产物到 Git
	@echo "📝 提交构建产物..."
	@git add index.html _next/ 404.html 404/ static/ 2>/dev/null || true
	@if git diff --staged --quiet; then \
		echo "✅ 没有新的构建产物需要提交"; \
	else \
		git commit -m "chore: update build artifacts" && \
		echo "✅ 构建产物已提交"; \
	fi

# 完整部署流程
deploy-full: clean install build export commit-build ## 完整部署流程：构建、导出、提交
	@echo "🚀 完整部署流程完成"
