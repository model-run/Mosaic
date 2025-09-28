# ModelRun.io

模型运行参数生成与部署助手 - 在不同显卡、推理引擎下，快速生成 Docker 启动命令。

## 🚀 快速开始

### 本地开发
```bash
# 安装依赖
make install

# 启动开发服务器
make dev
```

### GitHub Pages 部署
```bash
# 准备部署
make deploy-github-pages

# 提交并推送
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

## 📁 项目结构

```
Mosaic/
├── assets/                    # GitHub Pages 静态资源
│   ├── css/
│   │   └── style.scss         # Jekyll SCSS 样式文件
│   └── js/
│       └── site.js           # 站点 JavaScript
├── web/                      # Next.js 开发环境
│   ├── src/
│   │   ├── app/             # App Router
│   │   ├── components/       # React 组件
│   │   └── lib/             # 工具库
│   └── package.json
├── index.html                # GitHub Pages 主页面
├── _config.yml              # Jekyll 配置
└── .github/workflows/
    └── deploy.yml           # GitHub Actions
```

## 🛠 技术栈

- **前端**: Next.js 14, React 18, TypeScript
- **样式**: Tailwind CSS, Jekyll SCSS
- **部署**: GitHub Pages, GitHub Actions
- **包管理**: pnpm

## 📋 功能特性

- ✅ GPU 识别与推荐
- ✅ 模型参数配置
- ✅ 推理引擎选择
- ✅ Docker 命令生成
- ✅ 一键复制命令
- ✅ 响应式设计

## 🔧 开发命令

```bash
make help          # 查看所有命令
make install       # 安装依赖
make dev          # 启动开发服务器
make build        # 构建生产版本
make clean        # 清理缓存
```

## 📖 文档

详细文档请查看 [allaboutproject.md](./allaboutproject.md)

## 📄 许可证

[MIT License](./LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

© 2024 ModelRun.io - 让 AI 模型部署更简单
