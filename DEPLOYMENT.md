# ModelRun.io 部署指南

## 🚀 本地开发

### 环境要求

- Node.js 18.0.0 或更高版本
- pnpm 8.0.0 或更高版本

### 快速启动

```bash
# 克隆项目
git clone <repository-url>
cd Mosaic

# 查看所有可用命令
make help

# 启动开发服务器
make dev

# 或者直接使用 pnpm 命令
pnpm install
pnpm run dev
```

访问 http://localhost:3000 查看网站。

## 🌐 GitHub Pages 部署

### 自动部署

项目已配置 GitHub Actions 自动部署：

1. 推送代码到 `main` 分支
2. GitHub Actions 自动构建和部署
3. 网站将发布到 GitHub Pages

### 手动部署

```bash
# 使用 Makefile 完整部署流程
make deploy-full

# 或者分步执行
make export          # 构建并导出到根目录
make commit-build    # 提交构建产物到 Git

# 推送到远程仓库
git push origin main
```

## 🔧 配置说明

### 环境变量

在 `.env.local` 文件中配置：

```env
NODE_ENV=production
NEXT_PUBLIC_BASE_PATH=/Mosaic
```

### 自定义域名

1. 在仓库设置中启用 GitHub Pages
2. 添加自定义域名到 `CNAME` 文件
3. 配置 DNS 记录指向 GitHub Pages

## 📦 构建选项

### 开发模式

```bash
make dev
# 或
pnpm run dev
```

### 生产构建

```bash
make build
make start
# 或
pnpm run build
pnpm run start
```

### 静态导出

```bash
make export
# 或
pnpm run export
```

## 🐛 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本是否为 18+
   - 清除 node_modules 重新安装依赖

2. **样式不显示**
   - 确保 Tailwind CSS 配置正确
   - 检查 globals.css 文件

3. **TypeScript 错误**
   - 检查 tsconfig.json 配置
   - 确保类型定义正确

### 调试命令

```bash
# 查看所有可用命令
make help

# 检查环境
make check-env

# 运行完整检查
make check

# 清理缓存
make clean

# 或者直接使用 pnpm 命令
pnpm ls
pnpm run build
pnpm run type-check
pnpm run lint
```

## 📝 更新日志

- v1.0.0: 初始版本，支持基本的 GPU 选择和命令生成
- 后续版本将添加更多功能和优化

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
