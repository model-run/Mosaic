# ModelRun.io - 项目文档

## 项目简介

ModelRun.io 是一个模型运行参数生成与部署助手，帮助用户在不同显卡、推理引擎下快速生成 Docker 启动命令，并展示模型的最小运行规格、CUDA 版本要求及推荐配置。

## 架构说明

### 技术栈
- **前端框架**: Next.js 14+ (React 18+)
- **样式**: Tailwind CSS
- **部署**: GitHub Pages
- **语言**: TypeScript

### 项目结构
```
Mosaic/
├── allaboutproject.md          # 项目文档
├── README.md                   # 项目说明
├── package.json               # 依赖配置
├── next.config.js             # Next.js 配置
├── tailwind.config.js         # Tailwind 配置
├── public/                    # 静态资源
│   ├── images/               # 图片资源
│   └── favicon.ico           # 网站图标
├── src/
│   ├── app/                  # App Router
│   │   ├── page.tsx          # 主页面
│   │   ├── layout.tsx        # 布局组件
│   │   └── globals.css       # 全局样式
│   ├── components/           # 组件库
│   │   ├── GPUSelector.tsx   # GPU 选择器
│   │   ├── ModelSelector.tsx # 模型选择器
│   │   ├── EngineSelector.tsx # 推理引擎选择器
│   │   ├── ParameterForm.tsx # 参数配置表单
│   │   └── CommandGenerator.tsx # 命令生成器
│   ├── lib/                  # 工具库
│   │   ├── gpu-data.ts       # GPU 数据
│   │   ├── model-data.ts     # 模型数据
│   │   └── command-generator.ts # 命令生成逻辑
│   └── types/                # 类型定义
│       └── index.ts          # 通用类型
└── .github/
    └── workflows/
        └── deploy.yml        # GitHub Actions 部署配置
```

## 主要功能

### 1. GPU 识别与推荐
- 支持主流 GPU 型号（RTX 4090, A100, V100, H100 等）
- 自动匹配可用的推理引擎和兼容配置
- 显示 GPU 规格和性能参数

### 2. 模型支持
- **大语言模型**: LLaMA, ChatGLM, Mistral, Qwen 等
- **图像生成**: Stable Diffusion, DALL-E 等
- **多模态模型**: GPT-4V, LLaVA 等

### 3. 推理引擎
- **vLLM**: 高性能推理引擎
- **TensorRT-LLM**: NVIDIA 优化引擎
- **Transformers**: Hugging Face 标准库
- **Ollama**: 本地部署工具

### 4. Docker 命令生成
- 自动生成 GPU 加速配置
- 卷挂载和环境变量设置
- 端口映射和网络配置
- 资源限制和优化参数

## 组件说明

### GPUSelector 组件
```typescript
interface GPUInfo {
  name: string;
  memory: number; // GB
  cudaCapability: string;
  recommendedEngines: string[];
}
```

### ModelSelector 组件
```typescript
interface ModelInfo {
  name: string;
  size: string;
  minMemory: number; // GB
  cudaVersion: string;
  supportedEngines: string[];
}
```

### CommandGenerator 组件
```typescript
interface CommandConfig {
  gpu: GPUInfo;
  model: ModelInfo;
  engine: string;
  parameters: Record<string, any>;
}
```

## 使用方式

1. **选择 GPU**: 从下拉列表选择你的显卡型号
2. **选择模型**: 选择要运行的模型
3. **选择引擎**: 选择推理引擎
4. **配置参数**: 设置批处理大小、序列长度等参数
5. **生成命令**: 自动生成 Docker 启动命令
6. **复制运行**: 一键复制命令到终端运行

## 示例调用

### 基本使用
```bash
# 选择 RTX 4090 + LLaMA-7B + vLLM
# 生成命令:
docker run --gpus all \
  -v /my/models:/models \
  -p 8000:8000 \
  vllm/vllm-openai:latest \
  --model /models/llama-7b \
  --tensor-parallel-size 1 \
  --gpu-memory-utilization 0.8
```

### 高级配置
```bash
# 多 GPU 配置
docker run --gpus all \
  -v /my/models:/models \
  -p 8000:8000 \
  vllm/vllm-openai:latest \
  --model /models/llama-13b \
  --tensor-parallel-size 2 \
  --gpu-memory-utilization 0.9 \
  --max-model-len 4096
```

## 常见问题

### Q: 如何选择合适的推理引擎？
A: 根据你的 GPU 型号和模型大小选择：
- vLLM: 适合大语言模型，性能最佳
- TensorRT-LLM: NVIDIA GPU 优化，兼容性好
- Transformers: 通用性强，易于调试

### Q: 显存不足怎么办？
A: 可以尝试以下方法：
- 使用量化模型（4bit/8bit）
- 减少批处理大小
- 使用模型并行
- 选择更小的模型

### Q: 如何优化推理性能？
A: 建议配置：
- 启用 FP16 精度
- 调整 GPU 内存利用率
- 使用合适的批处理大小
- 启用 KV 缓存

## 调试建议

1. **检查 GPU 驱动**: 确保 CUDA 版本兼容
2. **验证模型路径**: 确保模型文件完整
3. **监控资源使用**: 使用 nvidia-smi 监控 GPU 使用率
4. **查看日志**: 检查容器日志排查问题
5. **测试连接**: 验证 API 接口是否正常响应

## 部署说明

### 本地开发
```bash
# 查看所有可用命令
make help

# 启动开发服务器
make dev

# 或直接使用 pnpm 命令
pnpm install
pnpm run dev
```

### 构建部署
```bash
# 使用 Makefile 完整部署流程
make deploy-full

# 或分步执行
make export          # 构建并导出到根目录
make commit-build    # 提交构建产物到 Git
```

### GitHub Pages 部署
项目配置了自动部署，推送到 main 分支即可自动部署到 GitHub Pages。

### 项目状态
✅ 已完成的功能：
- Next.js 14 项目结构初始化
- TypeScript 类型定义
- 响应式 UI 组件
- GPU/模型/引擎选择器
- 参数配置表单
- Docker 命令生成器
- GitHub Actions 自动部署
- 完整的项目文档
- pnpm 包管理器配置

🚀 项目已准备就绪，可以开始开发和使用！

### 包管理器说明
项目已从 npm 迁移到 pnpm，具有以下优势：
- 更快的安装速度
- 更少的磁盘空间占用
- 更严格的依赖管理
- 更好的 monorepo 支持

### Makefile 说明
项目使用 Makefile 提供标准化的开发命令：
- `make help`: 查看所有可用命令
- `make dev`: 启动开发服务器
- `make build`: 构建生产版本
- `make deploy`: 准备部署文件
- `make clean`: 清理缓存
- `make check`: 运行完整检查
