'use client';

import { useState } from 'react';
import { EngineInfo } from '@/types';
import { engineData } from '@/lib/engine-data';

interface EngineSelectorProps {
  selectedEngine: EngineInfo | null;
  onEngineChange: (engine: EngineInfo) => void;
  availableEngines?: EngineInfo[];
}

export default function EngineSelector({ 
  selectedEngine, 
  onEngineChange, 
  availableEngines = engineData 
}: EngineSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        选择推理引擎
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {selectedEngine ? (
          <div>
            <div className="font-medium">{selectedEngine.name}</div>
            <div className="text-sm text-gray-500">{selectedEngine.description}</div>
          </div>
        ) : (
          <span className="text-gray-500">请选择推理引擎...</span>
        )}
        <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {availableEngines.map((engine) => (
            <button
              key={engine.id}
              type="button"
              onClick={() => {
                onEngineChange(engine);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
            >
              <div>
                <div className="font-medium">{engine.name}</div>
                <div className="text-sm text-gray-500 mb-2">{engine.description}</div>
                <div className="text-xs text-gray-400">
                  <div className="mb-1">Docker 镜像: {engine.dockerImage}</div>
                  <div className="flex flex-wrap gap-1">
                    {engine.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
