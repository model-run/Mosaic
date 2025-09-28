// GPU 信息接口
export interface GPUInfo {
  id: string;
  name: string;
  memory: number; // GB
  cudaCapability: string;
  recommendedEngines: string[];
  tier: 'entry' | 'mid' | 'high' | 'professional';
}

// 模型信息接口
export interface ModelInfo {
  id: string;
  name: string;
  size: string;
  minMemory: number; // GB
  cudaVersion: string;
  supportedEngines: string[];
  category: 'llm' | 'vision' | 'multimodal';
  description: string;
}

// 推理引擎信息接口
export interface EngineInfo {
  id: string;
  name: string;
  description: string;
  dockerImage: string;
  supportedGPUs: string[];
  features: string[];
}

// 命令配置接口
export interface CommandConfig {
  gpu: GPUInfo;
  model: ModelInfo;
  engine: EngineInfo;
  parameters: {
    batchSize: number;
    maxSeqLen: number;
    useFp16: boolean;
    gpuMemoryUtilization: number;
    tensorParallelSize: number;
    port: number;
    modelPath: string;
  };
}

// 生成的命令结果
export interface GeneratedCommand {
  dockerCommand: string;
  environmentVariables: Record<string, string>;
  volumeMounts: string[];
  portMappings: string[];
  gpuConfig: string;
  additionalFlags: string[];
}
