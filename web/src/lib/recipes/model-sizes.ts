export interface ModelSize {
  /** Total parameters in billions (largest common variant). */
  paramsB: number;
}

// Partial by design — fit-advisor degrades when a model id is absent.
export const MODEL_SIZES: Record<string, ModelSize> = {
  "llama-3": { paramsB: 70 },
  "qwen-2-5": { paramsB: 72 },
  "mistral": { paramsB: 12 },
  "gemma": { paramsB: 27 },
  "phi": { paramsB: 14 },
  "internlm": { paramsB: 8 },
  "glm-4": { paramsB: 9 },
  "yi": { paramsB: 34 },
  "qwen3-32b-lmcache": { paramsB: 32 },
  "qwen3-32b-yrcache": { paramsB: 32 },
  "deepseek-v3": { paramsB: 671 },
  "deepseek-v2": { paramsB: 236 },
  "qwen3-moe": { paramsB: 235 },
  "llama4": { paramsB: 109 },
  "gpt-oss": { paramsB: 120 },
  "mixtral-moe": { paramsB: 141 },
};
