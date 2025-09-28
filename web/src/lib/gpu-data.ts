import { GPUInfo } from '@/types';

export const gpuData: GPUInfo[] = [
  {
    id: 'rtx-4090',
    name: 'NVIDIA RTX 4090',
    memory: 24,
    cudaCapability: '8.9',
    recommendedEngines: ['vllm', 'tensorrt-llm', 'transformers'],
    tier: 'high'
  },
  {
    id: 'rtx-4080',
    name: 'NVIDIA RTX 4080',
    memory: 16,
    cudaCapability: '8.9',
    recommendedEngines: ['vllm', 'tensorrt-llm', 'transformers'],
    tier: 'high'
  },
  {
    id: 'rtx-4070',
    name: 'NVIDIA RTX 4070',
    memory: 12,
    cudaCapability: '8.9',
    recommendedEngines: ['vllm', 'transformers'],
    tier: 'mid'
  },
  {
    id: 'rtx-3090',
    name: 'NVIDIA RTX 3090',
    memory: 24,
    cudaCapability: '8.6',
    recommendedEngines: ['vllm', 'tensorrt-llm', 'transformers'],
    tier: 'high'
  },
  {
    id: 'rtx-3080',
    name: 'NVIDIA RTX 3080',
    memory: 10,
    cudaCapability: '8.6',
    recommendedEngines: ['vllm', 'transformers'],
    tier: 'mid'
  },
  {
    id: 'a100-40gb',
    name: 'NVIDIA A100 40GB',
    memory: 40,
    cudaCapability: '8.0',
    recommendedEngines: ['vllm', 'tensorrt-llm', 'transformers'],
    tier: 'professional'
  },
  {
    id: 'a100-80gb',
    name: 'NVIDIA A100 80GB',
    memory: 80,
    cudaCapability: '8.0',
    recommendedEngines: ['vllm', 'tensorrt-llm', 'transformers'],
    tier: 'professional'
  },
  {
    id: 'v100-16gb',
    name: 'NVIDIA V100 16GB',
    memory: 16,
    cudaCapability: '7.0',
    recommendedEngines: ['transformers', 'tensorrt-llm'],
    tier: 'professional'
  },
  {
    id: 'h100-80gb',
    name: 'NVIDIA H100 80GB',
    memory: 80,
    cudaCapability: '9.0',
    recommendedEngines: ['vllm', 'tensorrt-llm', 'transformers'],
    tier: 'professional'
  },
  {
    id: 'rtx-3060',
    name: 'NVIDIA RTX 3060',
    memory: 12,
    cudaCapability: '8.6',
    recommendedEngines: ['transformers'],
    tier: 'entry'
  }
];
