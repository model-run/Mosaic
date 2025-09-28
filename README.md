# ModelRun.io

**模型运行参数生成与部署助手**  
在不同显卡、推理引擎下，快速生成 **Docker 启动命令**，并展示模型的最小运行规格、CUDA 版本要求及推荐配置。

## 🚀 快速开始

### 本地开发

```bash
# 查看所有可用命令
make help

# 启动开发服务器
make dev

# 构建生产版本
make build

# 导出静态文件到根目录
make export

# 构建并提交构建产物
make commit-build

# 完整部署流程
make deploy-full
```

### 在线访问

访问 [**modelrun.io**](https://modelrun.io) 使用在线版本。

## ✨ 功能特性

- 🔍 **显卡识别与推荐**  
  根据 GPU 型号，自动匹配可用的推理引擎和兼容配置。

- ⚙️ **主流模型启动参数模板**  
  内置常见大模型（如 LLaMA、ChatGLM、Mistral、Stable Diffusion 等）的启动参数推荐。

- 🐳 **一键生成 Docker 启动命令**  
  支持 GPU 加速、卷挂载、环境变量配置，避免手动拼命令的繁琐。

- 📊 **最小规格对照表**  
  展示不同模型的最低显存需求、推荐 CUDA 版本、驱动版本等。

- 🌐 **简洁直观的 Web 界面**  
  可视化选择显卡、模型、推理引擎，并实时预览生成的命令。

## 🛠 技术栈

- **前端**: Next.js 14 + React 18 + TypeScript
- **样式**: Tailwind CSS
- **包管理**: pnpm
- **部署**: GitHub Pages
- **构建**: Next.js Static Export

## 📦 项目结构

```
Mosaic/
├── web/                     # 网站源码目录
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/       # React 组件
│   │   ├── lib/              # 工具库和数据
│   │   └── types/            # TypeScript 类型定义
│   ├── public/               # 静态资源
│   ├── package.json          # 项目依赖
│   └── next.config.js        # Next.js 配置
├── .github/workflows/        # GitHub Actions 配置
├── index.html               # 构建后的网站入口（构建后生成）
├── _next/                   # Next.js 构建产物（构建后生成）
├── static/                  # 静态资源（构建后生成）
├── Makefile                 # 构建脚本
└── README.md               # 项目说明
```

## 🚀 使用示例

1. 选择你的 **显卡型号**（如 RTX 4090 / A100 / V100）  
2. 选择 **模型** 与 **推理引擎**  
3. 根据推荐参数或自定义参数生成命令  
4. 一键复制，运行容器 🚀

### 示例命令

```bash
docker run --gpus all \
  -v /my/models:/models \
  -p 8000:8000 \
  vllm/vllm-openai:latest \
  --model /models/llama-7b \
  --tensor-parallel-size 1 \
  --gpu-memory-utilization 0.8 \
  --max-model-len 4096 \
  --host 0.0.0.0 \
  --port 8000
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。
