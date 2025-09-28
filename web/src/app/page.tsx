'use client';

import { useState } from 'react';
import { GPUInfo, ModelInfo, EngineInfo } from '@/types';
import { modelData } from '@/lib/model-data';
import { engineData } from '@/lib/engine-data';
import GPUSelector from '@/components/GPUSelector';
import ModelSelector from '@/components/ModelSelector';
import EngineSelector from '@/components/EngineSelector';
import ParameterForm from '@/components/ParameterForm';
import CommandGenerator from '@/components/CommandGenerator';

export default function Home() {
  const [selectedGPU, setSelectedGPU] = useState<GPUInfo | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<EngineInfo | null>(null);
  const [parameters, setParameters] = useState<any>(null);

  // 根据选择的 GPU 过滤可用的模型
  const getAvailableModels = () => {
    if (!selectedGPU) return [];
    return modelData.filter(model => 
      model.minMemory <= selectedGPU.memory &&
      model.supportedEngines.some(engine => 
        selectedEngine ? engine === selectedEngine.id : true
      )
    );
  };

  // 根据选择的 GPU 和模型过滤可用的引擎
  const getAvailableEngines = () => {
    if (!selectedGPU) return [];
    const engines = engineData.filter(engine => 
      engine.supportedGPUs.includes(selectedGPU.id)
    );
    
    if (selectedModel) {
      return engines.filter(engine => 
        selectedModel.supportedEngines.includes(engine.id)
      );
    }
    
    return engines;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <img 
                  src="./logo.png" 
                  alt="ModelRun.io Logo" 
                  className="h-10 w-10 mr-3"
                />
                <h1 className="text-2xl font-bold text-gray-900">ModelRun.io</h1>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">模型运行参数生成与部署助手</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：配置面板 */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">配置选择</h2>
              
              <div className="space-y-6">
                {/* GPU 选择 */}
                <GPUSelector
                  selectedGPU={selectedGPU}
                  onGPUChange={setSelectedGPU}
                />

                {/* 模型选择 */}
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  availableModels={getAvailableModels()}
                />

                {/* 推理引擎选择 */}
                <EngineSelector
                  selectedEngine={selectedEngine}
                  onEngineChange={setSelectedEngine}
                  availableEngines={getAvailableEngines()}
                />
              </div>
            </div>

            {/* 参数配置 */}
            {selectedGPU && selectedModel && selectedEngine && (
              <div className="card">
                <ParameterForm
                  gpu={selectedGPU}
                  model={selectedModel}
                  engine={selectedEngine}
                  onParametersChange={setParameters}
                />
              </div>
            )}
          </div>

          {/* 右侧：命令生成 */}
          <div className="space-y-6">
            <div className="card">
              <CommandGenerator
                gpu={selectedGPU}
                model={selectedModel}
                engine={selectedEngine}
                parameters={parameters}
              />
            </div>

            {/* 功能特性 */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">功能特性</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">显卡识别</h4>
                    <p className="text-sm text-gray-500">自动匹配 GPU 和推理引擎</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">参数模板</h4>
                    <p className="text-sm text-gray-500">内置主流模型配置</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Docker 命令</h4>
                    <p className="text-sm text-gray-500">一键生成启动命令</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">规格对照</h4>
                    <p className="text-sm text-gray-500">显存需求和 CUDA 版本</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2024 ModelRun.io - 模型运行参数生成与部署助手</p>
            <p className="mt-2">
              支持主流 GPU 和推理引擎，让 AI 模型部署更简单
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
