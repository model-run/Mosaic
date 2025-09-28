import { ModelInfo } from '@/types';

export const modelData: ModelInfo[] = [
  // 大语言模型
  {
    id: 'llama-7b',
    name: 'LLaMA-7B',
    size: '7B',
    minMemory: 14,
    cudaVersion: '11.8+',
    supportedEngines: ['vllm', 'tensorrt-llm', 'transformers'],
    category: 'llm',
    description: 'Meta 开源的大语言模型，7B 参数版本'
  },
  {
    id: 'llama-13b',
    name: 'LLaMA-13B',
    size: '13B',
    minMemory: 26,
    cudaVersion: '11.8+',
    supportedEngines: ['vllm', 'tensorrt-llm', 'transformers'],
    category: 'llm',
    description: 'Meta 开源的大语言模型，13B 参数版本'
  },
  {
    id: 'llama-70b',
    name: 'LLaMA-70B',
    size: '70B',
    minMemory: 140,
    cudaVersion: '11.8+',
    supportedEngines: ['vllm', 'tensorrt-llm'],
    category: 'llm',
    description: 'Meta 开源的大语言模型，70B 参数版本'
  },
  {
    id: 'chatglm-6b',
    name: 'ChatGLM-6B',
    size: '6B',
    minMemory: 12,
    cudaVersion: '11.7+',
    supportedEngines: ['transformers', 'vllm'],
    category: 'llm',
    description: '智谱 AI 开源的中文对话模型'
  },
  {
    id: 'chatglm-32b',
    name: 'ChatGLM-32B',
    size: '32B',
    minMemory: 64,
    cudaVersion: '11.7+',
    supportedEngines: ['transformers', 'vllm'],
    category: 'llm',
    description: '智谱 AI 开源的中文对话模型，32B 参数版本'
  },
  {
    id: 'qwen-7b',
    name: 'Qwen-7B',
    size: '7B',
    minMemory: 14,
    cudaVersion: '11.8+',
    supportedEngines: ['vllm', 'transformers'],
    category: 'llm',
    description: '阿里云开源的通义千问模型'
  },
  {
    id: 'qwen-14b',
    name: 'Qwen-14B',
    size: '14B',
    minMemory: 28,
    cudaVersion: '11.8+',
    supportedEngines: ['vllm', 'transformers'],
    category: 'llm',
    description: '阿里云开源的通义千问模型，14B 参数版本'
  },
  {
    id: 'mistral-7b',
    name: 'Mistral-7B',
    size: '7B',
    minMemory: 14,
    cudaVersion: '11.8+',
    supportedEngines: ['vllm', 'transformers'],
    category: 'llm',
    description: 'Mistral AI 开源的高效语言模型'
  },
  // 图像生成模型
  {
    id: 'stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    size: '6.6B',
    minMemory: 8,
    cudaVersion: '11.8+',
    supportedEngines: ['transformers', 'diffusers'],
    category: 'vision',
    description: 'Stability AI 开源的图像生成模型'
  },
  {
    id: 'stable-diffusion-2.1',
    name: 'Stable Diffusion 2.1',
    size: '1.1B',
    minMemory: 4,
    cudaVersion: '11.7+',
    supportedEngines: ['transformers', 'diffusers'],
    category: 'vision',
    description: 'Stability AI 开源的图像生成模型'
  },
  // 多模态模型
  {
    id: 'llava-7b',
    name: 'LLaVA-7B',
    size: '7B',
    minMemory: 16,
    cudaVersion: '11.8+',
    supportedEngines: ['transformers'],
    category: 'multimodal',
    description: '多模态视觉语言模型，支持图像理解和对话'
  },
  {
    id: 'llava-13b',
    name: 'LLaVA-13B',
    size: '13B',
    minMemory: 28,
    cudaVersion: '11.8+',
    supportedEngines: ['transformers'],
    category: 'multimodal',
    description: '多模态视觉语言模型，13B 参数版本'
  }
];
