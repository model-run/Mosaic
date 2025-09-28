import { CommandConfig, GeneratedCommand } from '@/types';

export function generateDockerCommand(config: CommandConfig): GeneratedCommand {
  const { gpu, model, engine, parameters } = config;
  
  // 基础 Docker 命令
  let dockerCommand = `docker run --gpus all`;
  
  // GPU 配置
  const gpuConfig = `--gpus all`;
  
  // 端口映射
  const portMappings = [`-p ${parameters.port}:${parameters.port}`];
  
  // 卷挂载
  const volumeMounts = [
    `-v /my/models:${parameters.modelPath}`,
    `-v /tmp/.X11-unix:/tmp/.X11-unix:rw`
  ];
  
  // 环境变量
  const environmentVariables: Record<string, string> = {
    'CUDA_VISIBLE_DEVICES': '0',
    'NVIDIA_VISIBLE_DEVICES': 'all',
    'NVIDIA_DRIVER_CAPABILITIES': 'compute,utility'
  };
  
  // 根据引擎类型生成不同的命令
  let additionalFlags: string[] = [];
  
  switch (engine.id) {
    case 'vllm':
      dockerCommand += ` \\\n  ${portMappings.join(' \\\n  ')} \\\n  ${volumeMounts.join(' \\\n  ')} \\\n  ${engine.dockerImage}`;
      additionalFlags = [
        `--model ${parameters.modelPath}/${model.id}`,
        `--tensor-parallel-size ${parameters.tensorParallelSize}`,
        `--gpu-memory-utilization ${parameters.gpuMemoryUtilization}`,
        `--max-model-len ${parameters.maxSeqLen}`,
        `--host 0.0.0.0`,
        `--port ${parameters.port}`
      ];
      if (parameters.useFp16) {
        additionalFlags.push('--dtype half');
      }
      break;
      
    case 'tensorrt-llm':
      dockerCommand += ` \\\n  ${portMappings.join(' \\\n  ')} \\\n  ${volumeMounts.join(' \\\n  ')} \\\n  ${engine.dockerImage}`;
      additionalFlags = [
        `--model_dir ${parameters.modelPath}/${model.id}`,
        `--max_batch_size ${parameters.batchSize}`,
        `--max_input_len ${parameters.maxSeqLen}`,
        `--max_output_len ${parameters.maxSeqLen}`,
        `--host 0.0.0.0`,
        `--port ${parameters.port}`
      ];
      break;
      
    case 'transformers':
      dockerCommand += ` \\\n  ${portMappings.join(' \\\n  ')} \\\n  ${volumeMounts.join(' \\\n  ')} \\\n  ${engine.dockerImage}`;
      additionalFlags = [
        `python -m transformers.pipeline`,
        `--model_name_or_path ${parameters.modelPath}/${model.id}`,
        `--device_map auto`,
        `--torch_dtype ${parameters.useFp16 ? 'float16' : 'float32'}`,
        `--max_length ${parameters.maxSeqLen}`,
        `--batch_size ${parameters.batchSize}`
      ];
      break;
      
    case 'ollama':
      dockerCommand += ` \\\n  ${portMappings.join(' \\\n  ')} \\\n  ${volumeMounts.join(' \\\n  ')} \\\n  ${engine.dockerImage}`;
      additionalFlags = [
        `serve`,
        `--host 0.0.0.0:${parameters.port}`
      ];
      break;
  }
  
  // 添加环境变量
  const envVars = Object.entries(environmentVariables)
    .map(([key, value]) => `-e ${key}=${value}`)
    .join(' \\\n  ');
  
  if (envVars) {
    dockerCommand = dockerCommand.replace(engine.dockerImage, `${envVars} \\\n  ${engine.dockerImage}`);
  }
  
  // 添加额外参数
  if (additionalFlags.length > 0) {
    dockerCommand += ` \\\n  ${additionalFlags.join(' \\\n  ')}`;
  }
  
  return {
    dockerCommand,
    environmentVariables,
    volumeMounts,
    portMappings,
    gpuConfig,
    additionalFlags
  };
}

export function getRecommendedParameters(gpu: string, model: string, engine: string) {
  // 根据 GPU 和模型推荐参数
  const recommendations: Record<string, any> = {
    'rtx-4090': {
      batchSize: 4,
      maxSeqLen: 4096,
      gpuMemoryUtilization: 0.9,
      tensorParallelSize: 1
    },
    'rtx-4080': {
      batchSize: 2,
      maxSeqLen: 4096,
      gpuMemoryUtilization: 0.8,
      tensorParallelSize: 1
    },
    'rtx-4070': {
      batchSize: 1,
      maxSeqLen: 2048,
      gpuMemoryUtilization: 0.8,
      tensorParallelSize: 1
    },
    'a100-40gb': {
      batchSize: 8,
      maxSeqLen: 8192,
      gpuMemoryUtilization: 0.9,
      tensorParallelSize: 1
    },
    'a100-80gb': {
      batchSize: 16,
      maxSeqLen: 8192,
      gpuMemoryUtilization: 0.9,
      tensorParallelSize: 1
    }
  };
  
  return recommendations[gpu] || {
    batchSize: 1,
    maxSeqLen: 2048,
    gpuMemoryUtilization: 0.8,
    tensorParallelSize: 1
  };
}
