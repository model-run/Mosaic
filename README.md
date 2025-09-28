# ModelRun.io

**模型运行参数生成与部署助手**  
在不同显卡、推理引擎下，快速生成 **Docker 启动命令**，并展示模型的最小运行规格、CUDA 版本要求及推荐配置。

---

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

---

## 🚀 快速开始

1. 打开网站 [**modelrun.io**](https://modelrun.io)  
2. 选择你的 **显卡型号**（如 RTX 4090 / A100 / V100）  
3. 选择 **模型** 与 **推理引擎**  
4. 根据推荐参数或自定义参数生成命令  
5. 一键复制，运行容器 🚀

示例命令：

```bash
docker run --gpus all \
  -v /my/models:/models \
  modelrun/llama2-7b:latest \
  --model_path /models/llama2-7b \
  --batch_size 1 \
  --max_seq_len 2048 \
  --use_fp16
