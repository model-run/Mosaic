// ModelRun.io - Site JavaScript
// Main functionality for the ModelRun.io application

(function() {
    'use strict';

    // Application state
    const AppState = {
        selectedGPU: null,
        selectedModel: null,
        selectedEngine: null,
        parameters: {},
        generatedCommand: null
    };

    // GPU data
    const gpuData = {
        'rtx-4090': {
            name: 'NVIDIA RTX 4090',
            memory: 24,
            cudaCapability: '8.9',
            recommendedEngines: ['vLLM', 'TensorRT-LLM', 'Transformers']
        },
        'rtx-4080': {
            name: 'NVIDIA RTX 4080',
            memory: 16,
            cudaCapability: '8.9',
            recommendedEngines: ['vLLM', 'TensorRT-LLM', 'Transformers']
        },
        'a100': {
            name: 'NVIDIA A100',
            memory: 40,
            cudaCapability: '8.0',
            recommendedEngines: ['vLLM', 'TensorRT-LLM', 'Transformers']
        },
        'h100': {
            name: 'NVIDIA H100',
            memory: 80,
            cudaCapability: '9.0',
            recommendedEngines: ['vLLM', 'TensorRT-LLM', 'Transformers']
        }
    };

    // Model data
    const modelData = {
        'llama-7b': {
            name: 'LLaMA 7B',
            size: '7B',
            minMemory: 14,
            cudaVersion: '11.8+',
            supportedEngines: ['vLLM', 'TensorRT-LLM', 'Transformers']
        },
        'llama-13b': {
            name: 'LLaMA 13B',
            size: '13B',
            minMemory: 26,
            cudaVersion: '11.8+',
            supportedEngines: ['vLLM', 'TensorRT-LLM', 'Transformers']
        },
        'chatglm-6b': {
            name: 'ChatGLM-6B',
            size: '6B',
            minMemory: 12,
            cudaVersion: '11.8+',
            supportedEngines: ['Transformers', 'vLLM']
        },
        'qwen-7b': {
            name: 'Qwen 7B',
            size: '7B',
            minMemory: 14,
            cudaVersion: '11.8+',
            supportedEngines: ['vLLM', 'TensorRT-LLM', 'Transformers']
        }
    };

    // Engine data
    const engineData = {
        'vllm': {
            name: 'vLLM',
            description: 'High-performance inference engine',
            dockerImage: 'vllm/vllm-openai:latest',
            port: 8000
        },
        'tensorrt-llm': {
            name: 'TensorRT-LLM',
            description: 'NVIDIA optimized inference engine',
            dockerImage: 'nvcr.io/nvidia/tensorrt-llm:latest',
            port: 8000
        },
        'transformers': {
            name: 'Transformers',
            description: 'Hugging Face standard library',
            dockerImage: 'huggingface/transformers-pytorch-gpu:latest',
            port: 8000
        }
    };

    // Initialize the application
    function init() {
        console.log('ModelRun.io - Initializing application');
        
        // Initialize dropdowns
        initGPUSelector();
        initModelSelector();
        initEngineSelector();
        
        // Initialize event listeners
        initEventListeners();
        
        // Update UI state
        updateUI();
    }

    // Initialize GPU selector
    function initGPUSelector() {
        const gpuSelector = document.getElementById('gpu-selector');
        if (!gpuSelector) return;

        // Clear existing options
        gpuSelector.innerHTML = '<option value="">请选择 GPU...</option>';
        
        // Add GPU options
        Object.entries(gpuData).forEach(([key, gpu]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${gpu.name} (${gpu.memory}GB)`;
            gpuSelector.appendChild(option);
        });
    }

    // Initialize model selector
    function initModelSelector() {
        const modelSelector = document.getElementById('model-selector');
        if (!modelSelector) return;

        // Clear existing options
        modelSelector.innerHTML = '<option value="">请选择模型...</option>';
        
        // Add model options
        Object.entries(modelData).forEach(([key, model]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${model.name} (${model.size})`;
            modelSelector.appendChild(option);
        });
    }

    // Initialize engine selector
    function initEngineSelector() {
        const engineSelector = document.getElementById('engine-selector');
        if (!engineSelector) return;

        // Clear existing options
        engineSelector.innerHTML = '<option value="">请选择推理引擎...</option>';
        
        // Add engine options
        Object.entries(engineData).forEach(([key, engine]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = engine.name;
            engineSelector.appendChild(option);
        });
    }

    // Initialize event listeners
    function initEventListeners() {
        // GPU selection
        const gpuSelector = document.getElementById('gpu-selector');
        if (gpuSelector) {
            gpuSelector.addEventListener('change', handleGPUSelection);
        }

        // Model selection
        const modelSelector = document.getElementById('model-selector');
        if (modelSelector) {
            modelSelector.addEventListener('change', handleModelSelection);
        }

        // Engine selection
        const engineSelector = document.getElementById('engine-selector');
        if (engineSelector) {
            engineSelector.addEventListener('change', handleEngineSelection);
        }

        // Generate command button
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', generateCommand);
        }

        // Copy command button
        const copyBtn = document.getElementById('copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', copyCommand);
        }
    }

    // Handle GPU selection
    function handleGPUSelection(event) {
        const gpuId = event.target.value;
        AppState.selectedGPU = gpuId ? gpuData[gpuId] : null;
        
        // Update engine recommendations based on GPU
        updateEngineRecommendations();
        updateUI();
    }

    // Handle model selection
    function handleModelSelection(event) {
        const modelId = event.target.value;
        AppState.selectedModel = modelId ? modelData[modelId] : null;
        updateUI();
    }

    // Handle engine selection
    function handleEngineSelection(event) {
        const engineId = event.target.value;
        AppState.selectedEngine = engineId ? engineData[engineId] : null;
        updateUI();
    }

    // Update engine recommendations
    function updateEngineRecommendations() {
        const engineSelector = document.getElementById('engine-selector');
        if (!engineSelector || !AppState.selectedGPU) return;

        const gpu = AppState.selectedGPU;
        const recommendedEngines = gpu.recommendedEngines;
        
        // Update engine options with recommendations
        Array.from(engineSelector.options).forEach(option => {
            if (option.value) {
                const engine = engineData[option.value];
                const isRecommended = recommendedEngines.includes(engine.name);
                option.textContent = isRecommended ? 
                    `${engine.name} (推荐)` : engine.name;
            }
        });
    }

    // Update UI state
    function updateUI() {
        const generateBtn = document.getElementById('generate-btn');
        const commandOutput = document.getElementById('command-output');
        const statusMessage = document.getElementById('status-message');
        
        if (!generateBtn || !commandOutput || !statusMessage) return;

        // Check if all required fields are selected
        const isComplete = AppState.selectedGPU && AppState.selectedModel && AppState.selectedEngine;
        
        // Update generate button state
        generateBtn.disabled = !isComplete;
        
        if (isComplete) {
            statusMessage.textContent = '配置完成，点击"生成命令"按钮生成 Docker 命令';
            statusMessage.className = 'text-green-600';
        } else {
            statusMessage.textContent = '请先选择 GPU、模型和推理引擎，然后点击"生成命令"按钮';
            statusMessage.className = 'text-yellow-600';
        }
    }

    // Generate Docker command
    function generateCommand() {
        if (!AppState.selectedGPU || !AppState.selectedModel || !AppState.selectedEngine) {
            alert('请先选择 GPU、模型和推理引擎');
            return;
        }

        const gpu = AppState.selectedGPU;
        const model = AppState.selectedModel;
        const engine = AppState.selectedEngine;

        // Generate command based on engine
        let command = '';
        
        if (engine.name === 'vLLM') {
            command = generateVLLMCommand(gpu, model, engine);
        } else if (engine.name === 'TensorRT-LLM') {
            command = generateTensorRTCommand(gpu, model, engine);
        } else if (engine.name === 'Transformers') {
            command = generateTransformersCommand(gpu, model, engine);
        }

        AppState.generatedCommand = command;
        
        // Update UI
        const commandOutput = document.getElementById('command-output');
        const copyBtn = document.getElementById('copy-btn');
        
        if (commandOutput) {
            commandOutput.textContent = command;
            commandOutput.style.display = 'block';
        }
        
        if (copyBtn) {
            copyBtn.style.display = 'inline-flex';
        }
    }

    // Generate vLLM command
    function generateVLLMCommand(gpu, model, engine) {
        const memoryUtilization = Math.min(0.9, (gpu.memory - 2) / gpu.memory);
        
        return `docker run --gpus all \\
  -v /path/to/models:/models \\
  -p ${engine.port}:${engine.port} \\
  ${engine.dockerImage} \\
  --model /models/${model.name.toLowerCase().replace(/\s+/g, '-')} \\
  --tensor-parallel-size 1 \\
  --gpu-memory-utilization ${memoryUtilization.toFixed(2)} \\
  --max-model-len 4096 \\
  --host 0.0.0.0 \\
  --port ${engine.port}`;
    }

    // Generate TensorRT-LLM command
    function generateTensorRTCommand(gpu, model, engine) {
        return `docker run --gpus all \\
  -v /path/to/models:/models \\
  -p ${engine.port}:${engine.port} \\
  ${engine.dockerImage} \\
  --model /models/${model.name.toLowerCase().replace(/\s+/g, '-')} \\
  --max-batch-size 32 \\
  --max-input-len 2048 \\
  --max-output-len 1024 \\
  --host 0.0.0.0 \\
  --port ${engine.port}`;
    }

    // Generate Transformers command
    function generateTransformersCommand(gpu, model, engine) {
        return `docker run --gpus all \\
  -v /path/to/models:/models \\
  -p ${engine.port}:${engine.port} \\
  ${engine.dockerImage} \\
  --model-name /models/${model.name.toLowerCase().replace(/\s+/g, '-')} \\
  --max-length 4096 \\
  --batch-size 1 \\
  --host 0.0.0.0 \\
  --port ${engine.port}`;
    }

    // Copy command to clipboard
    function copyCommand() {
        if (!AppState.generatedCommand) return;

        navigator.clipboard.writeText(AppState.generatedCommand).then(() => {
            // Show success message
            const copyBtn = document.getElementById('copy-btn');
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '已复制!';
                copyBtn.style.backgroundColor = '#10b981';
                
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.style.backgroundColor = '';
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy command:', err);
            alert('复制失败，请手动复制命令');
        });
    }

    // Utility function to show notifications
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for global access
    window.ModelRun = {
        AppState,
        generateCommand,
        copyCommand,
        showNotification
    };

})();
