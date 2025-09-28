'use client';

import { useState } from 'react';
import { GPUInfo, ModelInfo, EngineInfo, GeneratedCommand } from '@/types';
import { generateDockerCommand } from '@/lib/command-generator';

interface CommandGeneratorProps {
  gpu: GPUInfo | null;
  model: ModelInfo | null;
  engine: EngineInfo | null;
  parameters: any;
}

export default function CommandGenerator({ gpu, model, engine, parameters }: CommandGeneratorProps) {
  const [generatedCommand, setGeneratedCommand] = useState<GeneratedCommand | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!gpu || !model || !engine) {
      alert('请先选择 GPU、模型和推理引擎');
      return;
    }

    setIsGenerating(true);
    
    try {
      const config = {
        gpu,
        model,
        engine,
        parameters
      };
      
      const command = generateDockerCommand(config);
      setGeneratedCommand(command);
    } catch (error) {
      console.error('生成命令时出错:', error);
      alert('生成命令时出错，请检查配置');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('命令已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('命令已复制到剪贴板');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">生成的 Docker 命令</h3>
        <button
          onClick={handleGenerate}
          disabled={!gpu || !model || !engine || isGenerating}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? '生成中...' : '生成命令'}
        </button>
      </div>

      {generatedCommand && (
        <div className="space-y-4">
          {/* 主要 Docker 命令 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Docker 启动命令
            </label>
            <div className="relative">
              <pre className="code-block whitespace-pre-wrap">
                {generatedCommand.dockerCommand}
              </pre>
              <button
                onClick={() => copyToClipboard(generatedCommand.dockerCommand)}
                className="absolute top-2 right-2 btn-secondary text-xs"
              >
                复制
              </button>
            </div>
          </div>

          {/* 环境变量 */}
          {Object.keys(generatedCommand.environmentVariables).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                环境变量
              </label>
              <div className="bg-gray-50 p-4 rounded-lg">
                {Object.entries(generatedCommand.environmentVariables).map(([key, value]) => (
                  <div key={key} className="text-sm font-mono">
                    <span className="text-blue-600">{key}</span>=<span className="text-green-600">&quot;{value}&quot;</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 卷挂载 */}
          {generatedCommand.volumeMounts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                卷挂载
              </label>
              <div className="bg-gray-50 p-4 rounded-lg">
                {generatedCommand.volumeMounts.map((mount, index) => (
                  <div key={index} className="text-sm font-mono">
                    {mount}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 端口映射 */}
          {generatedCommand.portMappings.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                端口映射
              </label>
              <div className="bg-gray-50 p-4 rounded-lg">
                {generatedCommand.portMappings.map((mapping, index) => (
                  <div key={index} className="text-sm font-mono">
                    {mapping}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 使用说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">使用说明</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. 确保已安装 Docker 和 NVIDIA Container Toolkit</li>
              <li>2. 将模型文件放置在本地目录（如 /my/models）</li>
              <li>3. 复制上述命令到终端运行</li>
              <li>4. 等待容器启动完成</li>
              <li>5. 通过 http://localhost:{parameters.port} 访问服务</li>
            </ol>
          </div>
        </div>
      )}

      {!gpu || !model || !engine ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            请先选择 GPU、模型和推理引擎，然后点击&ldquo;生成命令&rdquo;按钮
          </p>
        </div>
      ) : null}
    </div>
  );
}
