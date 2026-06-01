import type { EngineId, Precision } from "@/lib/recipes/types";

/**
 * Per-engine selectable precisions. First entry is always "fp16" (the base).
 * Defaults vetted against engine docs; tune here without touching logic.
 */
export const QUANT_SUPPORT: Record<EngineId, Precision[]> = {
  "vllm":        ["fp16", "fp8", "awq", "gptq"],
  "vllm-ascend": ["fp16", "fp8", "awq", "gptq"],
  "sglang":      ["fp16", "fp8", "awq", "gptq"],
  "tgi":         ["fp16", "awq", "gptq", "fp8"],
  "lmdeploy":    ["fp16", "awq"],
  "trtllm":      ["fp16", "fp8"],
  "mindie":      ["fp16", "fp8"],
  "llamacpp":    ["fp16", "gguf"],
  "tei":         ["fp16"],
  "infinity":    ["fp16"],
  "comfyui":     ["fp16"],
};
