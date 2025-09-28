'use client';

import { useState } from 'react';
import { GPUInfo } from '@/types';
import { gpuData } from '@/lib/gpu-data';

interface GPUSelectorProps {
  selectedGPU: GPUInfo | null;
  onGPUChange: (gpu: GPUInfo) => void;
}

export default function GPUSelector({ selectedGPU, onGPUChange }: GPUSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'entry': return 'bg-green-100 text-green-800';
      case 'mid': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-purple-100 text-purple-800';
      case 'professional': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'entry': return '入门级';
      case 'mid': return '中端';
      case 'high': return '高端';
      case 'professional': return '专业级';
      default: return '未知';
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        选择 GPU
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {selectedGPU ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{selectedGPU.name}</div>
              <div className="text-sm text-gray-500">
                {selectedGPU.memory}GB 显存 • CUDA {selectedGPU.cudaCapability}
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(selectedGPU.tier)}`}>
              {getTierLabel(selectedGPU.tier)}
            </span>
          </div>
        ) : (
          <span className="text-gray-500">请选择 GPU...</span>
        )}
        <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {gpuData.map((gpu) => (
            <button
              key={gpu.id}
              type="button"
              onClick={() => {
                onGPUChange(gpu);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{gpu.name}</div>
                  <div className="text-sm text-gray-500">
                    {gpu.memory}GB 显存 • CUDA {gpu.cudaCapability}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(gpu.tier)}`}>
                  {getTierLabel(gpu.tier)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
