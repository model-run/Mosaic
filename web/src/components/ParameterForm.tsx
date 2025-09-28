'use client';

import { useState, useEffect } from 'react';
import { GPUInfo, ModelInfo, EngineInfo } from '@/types';
import { getRecommendedParameters } from '@/lib/command-generator';

interface ParameterFormProps {
  gpu: GPUInfo | null;
  model: ModelInfo | null;
  engine: EngineInfo | null;
  onParametersChange: (parameters: any) => void;
}

export default function ParameterForm({ gpu, model, engine, onParametersChange }: ParameterFormProps) {
  const [parameters, setParameters] = useState({
    batchSize: 1,
    maxSeqLen: 2048,
    useFp16: true,
    gpuMemoryUtilization: 0.8,
    tensorParallelSize: 1,
    port: 8000,
    modelPath: '/models'
  });

  // 当 GPU 或模型改变时，自动推荐参数
  useEffect(() => {
    if (gpu && model) {
      const recommended = getRecommendedParameters(gpu.id, model.id, engine?.id || '');
      setParameters(prev => ({
        ...prev,
        ...recommended,
        modelPath: `/models/${model.id}`
      }));
    }
  }, [gpu, model, engine]);

  // 当参数改变时，通知父组件
  useEffect(() => {
    onParametersChange(parameters);
  }, [parameters, onParametersChange]);

  const handleParameterChange = (key: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">参数配置</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 批处理大小 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              批处理大小
            </label>
            <input
              type="number"
              min="1"
              max="32"
              value={parameters.batchSize}
              onChange={(e) => handleParameterChange('batchSize', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              同时处理的请求数量，影响显存使用和吞吐量
            </p>
          </div>

          {/* 最大序列长度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最大序列长度
            </label>
            <select
              value={parameters.maxSeqLen}
              onChange={(e) => handleParameterChange('maxSeqLen', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={1024}>1024</option>
              <option value={2048}>2048</option>
              <option value={4096}>4096</option>
              <option value={8192}>8192</option>
              <option value={16384}>16384</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              模型能处理的最大输入长度
            </p>
          </div>

          {/* GPU 内存利用率 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GPU 内存利用率: {Math.round(parameters.gpuMemoryUtilization * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={parameters.gpuMemoryUtilization}
              onChange={(e) => handleParameterChange('gpuMemoryUtilization', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              分配给模型推理的 GPU 内存比例
            </p>
          </div>

          {/* 张量并行大小 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              张量并行大小
            </label>
            <select
              value={parameters.tensorParallelSize}
              onChange={(e) => handleParameterChange('tensorParallelSize', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={1}>1 (单 GPU)</option>
              <option value={2}>2 (双 GPU)</option>
              <option value={4}>4 (四 GPU)</option>
              <option value={8}>8 (八 GPU)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              用于模型并行推理的 GPU 数量
            </p>
          </div>

          {/* 端口 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              服务端口
            </label>
            <input
              type="number"
              min="1000"
              max="65535"
              value={parameters.port}
              onChange={(e) => handleParameterChange('port', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              API 服务监听的端口号
            </p>
          </div>

          {/* 模型路径 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              模型路径
            </label>
            <input
              type="text"
              value={parameters.modelPath}
              onChange={(e) => handleParameterChange('modelPath', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              模型文件在容器内的路径
            </p>
          </div>
        </div>

        {/* 高级选项 */}
        <div className="mt-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useFp16"
              checked={parameters.useFp16}
              onChange={(e) => handleParameterChange('useFp16', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="useFp16" className="ml-2 block text-sm text-gray-700">
              使用 FP16 精度 (减少显存使用，可能影响精度)
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
