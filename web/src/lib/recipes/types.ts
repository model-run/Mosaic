// Ported from modeldoctor deployment-recipes/types.ts.
// EngineId is inlined here (no @modeldoctor/contracts dependency).

export type EngineId =
  | "vllm"
  | "vllm-ascend"
  | "sglang"
  | "trtllm"
  | "mindie"
  | "lmdeploy"
  | "tgi"
  | "tei"
  | "infinity"
  | "llamacpp"
  | "comfyui";

/**
 * Recipe support status.
 * - native    upstream-supported, ships in the engine vendor's release
 * - partial   upstream supports the model but with caveats
 * - community not upstream — internally-built image and/or hot-patch
 * - none      known not to work
 */
export type RecipeStatus = "native" | "partial" | "community" | "none";

export type CategoryId =
  | "dense" | "moe" | "vlm" | "embedding" | "rerank" | "diffusion";

export interface EngineMeta {
  id: EngineId;
  name: string;
  vendor: string;
}

export const CATEGORY_ORDER: CategoryId[] = [
  "dense", "moe", "vlm", "embedding", "rerank", "diffusion",
];

export interface RecipeParam {
  key: string;
  value: string;
  desc: string;
}

/** Quantization precisions the matrix can expose. */
export type Precision = "fp16" | "fp8" | "awq" | "gptq" | "gguf";

/**
 * Hand-written override for a specific precision. Any field provided replaces
 * the corresponding base recipe field wholesale; omitted fields fall back to base.
 */
export interface QuantVariant {
  // `status` is intentionally omitted — overrides cannot change support level; inherit from base recipe.
  image?: string;
  command?: string;
  params?: RecipeParam[];
  resource?: string;
  notes?: string;
}

export interface EngineRecipe {
  status: RecipeStatus;
  minVersion?: string;
  image?: string;
  command?: string;
  params?: RecipeParam[];
  resource?: string;
  notes?: string;
  docUrl?: string;
  tooltip?: string;
  variants?: Partial<Record<Precision, QuantVariant>>;
}

export interface ModelEntry {
  id: string;
  name: string;
  category: CategoryId;
  meta: string;
  engines: Partial<Record<EngineId, EngineRecipe>>;
}
