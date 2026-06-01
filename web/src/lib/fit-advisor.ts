import type { GPUInfo } from "@/types";
import { MODEL_SIZES } from "@/lib/recipes/model-sizes";
import type { Precision } from "@/lib/recipes/types";

export type { Precision };

const BYTES_PER_PARAM: Record<Precision, number> = {
  fp16: 2, fp8: 1, awq: 0.5, gptq: 0.5, gguf: 0.5,
};
const OVERHEAD = 1.2; // KV cache + activation headroom

export interface FitResult {
  knownSize: boolean;
  totalAvailableGB: number;
  requiredGB?: number;
  fits?: boolean;
  recommendedTP: number;
  suggestQuantization: boolean;
}

export function advise(
  modelId: string,
  gpu: GPUInfo,
  count: number,
  precision: Precision = "fp16",
): FitResult {
  const cards = Math.max(1, count);
  const availableGB = gpu.memory * cards;
  const size = MODEL_SIZES[modelId];

  if (!size) {
    return { knownSize: false, totalAvailableGB: availableGB, recommendedTP: 1, suggestQuantization: false };
  }

  const requiredGB = size.paramsB * BYTES_PER_PARAM[precision] * OVERHEAD;
  const fits = requiredGB <= availableGB;
  const recommendedTP = Math.min(cards, Math.max(1, Math.ceil(requiredGB / gpu.memory)));
  // Would the model fit on the same hardware if quantized to AWQ (0.5 B/param)?
  const quantRequiredGB = size.paramsB * BYTES_PER_PARAM.awq * OVERHEAD;
  const suggestQuantization = !fits && quantRequiredGB <= availableGB;

  return { knownSize: true, totalAvailableGB: availableGB, requiredGB, fits, recommendedTP, suggestQuantization };
}
