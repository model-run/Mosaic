'use client';

import { useState } from 'react';
import { ModelInfo } from '@/types';
import { modelData } from '@/lib/model-data';

interface ModelSelectorProps {
  selectedModel: ModelInfo | null;
  onModelChange: (model: ModelInfo) => void;
  availableModels?: ModelInfo[];
}

export default function ModelSelector({ 
  selectedModel, 
  onModelChange, 
  availableModels = modelData 
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const filteredModels = availableModels.filter(model =>
    model.name.toLowerCase().includes(filter.toLowerCase()) ||
    model.description.toLowerCase().includes(filter.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'llm': return 'bg-blue-100 text-blue-800';
      case 'vision': return 'bg-green-100 text-green-800';
      case 'multimodal': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'llm': return '大语言模型';
      case 'vision': return '图像生成';
      case 'multimodal': return '多模态';
      default: return '其他';
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        选择模型
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {selectedModel ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{selectedModel.name}</div>
              <div className="text-sm text-gray-500">
                {selectedModel.size} • 最低 {selectedModel.minMemory}GB 显存
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedModel.category)}`}>
              {getCategoryLabel(selectedModel.category)}
            </span>
          </div>
        ) : (
          <span className="text-gray-500">请选择模型...</span>
        )}
        <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="搜索模型..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="max-h-60 overflow-auto">
            {filteredModels.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  onModelChange(model);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{model.name}</div>
                    <div className="text-sm text-gray-500 mb-1">
                      {model.size} • 最低 {model.minMemory}GB 显存 • CUDA {model.cudaVersion}
                    </div>
                    <div className="text-xs text-gray-400">{model.description}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(model.category)}`}>
                    {getCategoryLabel(model.category)}
                  </span>
                </div>
              </button>
            ))}
            {filteredModels.length === 0 && (
              <div className="px-4 py-3 text-gray-500 text-center">
                未找到匹配的模型
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
