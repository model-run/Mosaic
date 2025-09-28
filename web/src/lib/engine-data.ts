import { EngineInfo } from '@/types';

export const engineData: EngineInfo[] = [
  {
    id: 'vllm',
    name: 'vLLM',
    description: '高性能大语言模型推理引擎，支持连续批处理和 PagedAttention',
    dockerImage: 'vllm/vllm-openai:latest',
    supportedGPUs: ['rtx-4090', 'rtx-4080', 'rtx-4070', 'rtx-3090', 'rtx-3080', 'a100-40gb', 'a100-80gb', 'h100-80gb'],
    features: ['连续批处理', 'PagedAttention', '动态批处理', '多 GPU 支持', 'OpenAI 兼容 API']
  },
  {
    id: 'tensorrt-llm',
    name: 'TensorRT-LLM',
    description: 'NVIDIA 优化的推理引擎，针对 NVIDIA GPU 深度优化',
    dockerImage: 'nvcr.io/nvidia/tensorrt-llm:latest',
    supportedGPUs: ['rtx-4090', 'rtx-4080', 'rtx-4070', 'rtx-3090', 'rtx-3080', 'a100-40gb', 'a100-80gb', 'h100-80gb', 'v100-16gb'],
    features: ['TensorRT 优化', '量化支持', '多 GPU 并行', '动态形状', '高性能推理']
  },
  {
    id: 'transformers',
    name: 'Transformers',
    description: 'Hugging Face 标准推理库，兼容性最好，易于调试',
    dockerImage: 'huggingface/transformers-pytorch-gpu:latest',
    supportedGPUs: ['rtx-4090', 'rtx-4080', 'rtx-4070', 'rtx-3090', 'rtx-3080', 'a100-40gb', 'a100-80gb', 'h100-80gb', 'v100-16gb', 'rtx-3060'],
    features: ['广泛兼容', '易于调试', '丰富模型支持', '量化支持', '社区活跃']
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: '本地部署工具，支持多种模型格式，使用简单',
    dockerImage: 'ollama/ollama:latest',
    supportedGPUs: ['rtx-4090', 'rtx-4080', 'rtx-4070', 'rtx-3090', 'rtx-3080', 'a100-40gb', 'a100-80gb', 'h100-80gb', 'rtx-3060'],
    features: ['简单易用', '自动模型管理', 'RESTful API', '多模型支持', '本地部署']
  }
];
