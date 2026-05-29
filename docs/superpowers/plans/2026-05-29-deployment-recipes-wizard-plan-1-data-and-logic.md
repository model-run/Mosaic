# Deployment Recipes Wizard — Plan 1: Data Foundation + Wizard Logic (P0 + P1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate modeldoctor's `deployment-recipes` data into Mosaic and build the scenario-first wizard's pure-logic layer (scenario filtering, GPU fit advice, command building), with a plain-styled 5-step wizard wired end-to-end. No aurora styling yet (that's Plan 2).

**Architecture:** Port modeldoctor's recipe data structures verbatim into `web/src/lib/recipes/` (inlining the `EngineId` type so we drop the `@modeldoctor/contracts` dependency). Add three Mosaic-owned pure modules — `scenarios.ts`, `fit-advisor.ts`, `command-builder.ts` — plus a small `model-sizes.ts` numeric map (recipes carry no numeric weight, so the fit-advisor needs its own source). Replace the old GPU-first wizard in `page.tsx` with a scenario-first 5-step state machine consuming the new modules. Delete the stale `model-data.ts` / `engine-data.ts` / `command-generator.ts`.

**Tech Stack:** Next.js 14 (static export), React 18, TypeScript 5, Tailwind 3, pnpm 8. Tests via Vitest (added in Task 1).

**Source of truth for the port:** `/Users/fangyong/vllm/modeldoctor/main/apps/web/src/features/deployment-recipes/{types.ts,data.ts}`.

---

## File Structure

```
web/
├── vitest.config.ts                  # NEW (Task 1)
├── package.json                      # MODIFY: add vitest + scripts (Task 1)
└── src/
    ├── lib/
    │   ├── recipes/
    │   │   ├── types.ts              # NEW — ported types, EngineId inlined (Task 2)
    │   │   ├── engines.ts            # NEW — 11 engine metadata entries (Task 3)
    │   │   ├── data.ts               # NEW — ~35 model recipes, verbatim port (Task 4)
    │   │   ├── model-sizes.ts        # NEW — Mosaic-owned numeric weight hints (Task 5)
    │   │   ├── scenarios.ts          # NEW — scenario → categories + model filter (Task 6)
    │   │   └── __tests__/            # NEW — data + scenarios tests
    │   ├── fit-advisor.ts            # NEW — pure GPU fit calc (Task 7)
    │   ├── command-builder.ts        # NEW — pure command rewrite (Task 8)
    │   ├── __tests__/                # NEW — fit-advisor + command-builder tests
    │   ├── gpu-data.ts               # KEEP as-is (extended in Plan 3 / P4)
    │   ├── model-data.ts             # DELETE (Task 9)
    │   ├── engine-data.ts            # DELETE (Task 9)
    │   └── command-generator.ts      # DELETE (Task 9)
    ├── types/index.ts                # MODIFY: keep GPUInfo; remove dead types (Task 9)
    ├── app/page.tsx                  # REWRITE: 5-step scenario-first wizard (Task 9)
    └── components/                   # OLD selectors removed/replaced (Task 9)
```

---

## Task 1: Add Vitest test infrastructure

**Files:**
- Modify: `web/package.json`
- Create: `web/vitest.config.ts`
- Create: `web/src/lib/__tests__/smoke.test.ts`

- [ ] **Step 1: Add Vitest dev deps**

Run (from `web/`):
```bash
cd /Users/fangyong/agent/Mosaic/web && pnpm add -D vitest@^2 @vitest/coverage-v8@^2
```
Expected: `vitest` + coverage appear in `devDependencies`.

- [ ] **Step 2: Add test scripts to `package.json`**

In `web/package.json` `"scripts"`, add:
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Create `web/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Write a smoke test** at `web/src/lib/__tests__/smoke.test.ts`

```ts
import { describe, it, expect } from "vitest";

describe("test infra", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test`
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/package.json web/pnpm-lock.yaml web/vitest.config.ts web/src/lib/__tests__/smoke.test.ts && git commit -m "test: add vitest infrastructure"
```

---

## Task 2: Port recipe types (`recipes/types.ts`) with inlined `EngineId`

**Files:**
- Create: `web/src/lib/recipes/types.ts`
- Test: `web/src/lib/recipes/__tests__/types.test.ts`

The modeldoctor original imports `EngineId` from `@modeldoctor/contracts`. We inline it as a union so Mosaic has no external dep.

- [ ] **Step 1: Write the failing test** at `web/src/lib/recipes/__tests__/types.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { CATEGORY_ORDER } from "@/lib/recipes/types";

describe("recipe types", () => {
  it("exposes the 6 categories in display order", () => {
    expect(CATEGORY_ORDER).toEqual([
      "dense", "moe", "vlm", "embedding", "rerank", "diffusion",
    ]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/recipes/__tests__/types.test.ts`
Expected: FAIL — cannot find module `@/lib/recipes/types`.

- [ ] **Step 3: Create `web/src/lib/recipes/types.ts`**

```ts
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
}

export interface ModelEntry {
  id: string;
  name: string;
  category: CategoryId;
  meta: string;
  engines: Partial<Record<EngineId, EngineRecipe>>;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/recipes/__tests__/types.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/lib/recipes/types.ts web/src/lib/recipes/__tests__/types.test.ts && git commit -m "feat(recipes): port recipe types with inlined EngineId"
```

---

## Task 3: Port engine metadata (`recipes/engines.ts`)

**Files:**
- Create: `web/src/lib/recipes/engines.ts`
- Test: `web/src/lib/recipes/__tests__/engines.test.ts`

- [ ] **Step 1: Write the failing test** at `web/src/lib/recipes/__tests__/engines.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { ENGINES } from "@/lib/recipes/engines";

describe("engines", () => {
  it("lists all 11 engines", () => {
    expect(ENGINES).toHaveLength(11);
  });
  it("includes vllm and vllm-ascend", () => {
    const ids = ENGINES.map((e) => e.id);
    expect(ids).toContain("vllm");
    expect(ids).toContain("vllm-ascend");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/recipes/__tests__/engines.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/src/lib/recipes/engines.ts`** (verbatim from modeldoctor `data.ts` `ENGINES` array)

```ts
import type { EngineMeta } from "./types";

export const ENGINES: EngineMeta[] = [
  { id: "vllm", name: "vLLM", vendor: "UC Berkeley" },
  { id: "vllm-ascend", name: "vLLM-Ascend", vendor: "Huawei Ascend × vLLM" },
  { id: "sglang", name: "SGLang", vendor: "LMSYS" },
  { id: "trtllm", name: "TensorRT-LLM", vendor: "NVIDIA" },
  { id: "mindie", name: "MindIE", vendor: "Huawei Ascend" },
  { id: "lmdeploy", name: "LMDeploy", vendor: "InternLM" },
  { id: "tgi", name: "TGI", vendor: "HuggingFace" },
  { id: "tei", name: "TEI", vendor: "HuggingFace" },
  { id: "infinity", name: "Infinity", vendor: "Michael Feil" },
  { id: "llamacpp", name: "llama.cpp", vendor: "ggml.ai" },
  { id: "comfyui", name: "ComfyUI / Diffusers", vendor: "comfyanonymous · HF" },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/recipes/__tests__/engines.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/lib/recipes/engines.ts web/src/lib/recipes/__tests__/engines.test.ts && git commit -m "feat(recipes): port 11-engine metadata"
```

---

## Task 4: Port the full recipe dataset (`recipes/data.ts`)

**Files:**
- Create: `web/src/lib/recipes/data.ts`
- Test: `web/src/lib/recipes/__tests__/data.test.ts`

This is a verbatim port of modeldoctor's `MODELS` array (~35 entries, ~1193 lines). The ONLY transformations:
1. Drop the carve-out header comment block (lines 1–4 of the original).
2. Change the import line to point at the local types and drop the `ENGINES` re-export (that now lives in `engines.ts`).
3. Keep the `native()` / `partial()` / `community()` builders and the `HF_VOL` constant exactly.
4. Do NOT copy the `ENGINES` array here (it lives in `engines.ts` — Task 3).

- [ ] **Step 1: Write the failing test** at `web/src/lib/recipes/__tests__/data.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { MODELS } from "@/lib/recipes/data";
import { CATEGORY_ORDER } from "@/lib/recipes/types";

describe("recipe data", () => {
  it("ports the full catalog (>= 30 models)", () => {
    expect(MODELS.length).toBeGreaterThanOrEqual(30);
  });

  it("every model has a known category and at least one engine", () => {
    for (const m of MODELS) {
      expect(CATEGORY_ORDER).toContain(m.category);
      expect(Object.keys(m.engines).length).toBeGreaterThan(0);
    }
  });

  it("covers all six categories", () => {
    const cats = new Set(MODELS.map((m) => m.category));
    for (const c of CATEGORY_ORDER) expect(cats.has(c)).toBe(true);
  });

  it("includes flagship 2025/2026 models", () => {
    const ids = MODELS.map((m) => m.id);
    expect(ids).toContain("deepseek-v3");
    expect(ids).toContain("qwen3-moe");
    expect(ids).toContain("llama4");
  });

  it("every command string references its own image (no leftover placeholders)", () => {
    for (const m of MODELS) {
      for (const r of Object.values(m.engines)) {
        if (r?.command) {
          expect(r.command).not.toContain("${modelPath}");
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/recipes/__tests__/data.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/src/lib/recipes/data.ts`**

Copy the entire contents of `/Users/fangyong/vllm/modeldoctor/main/apps/web/src/features/deployment-recipes/data.ts`, then apply exactly one edit to the copy:

**Delete everything from the top of the file up to (but NOT including) the line `export const MODELS: ModelEntry[] = [`.** That deleted region contains, in the original: the carve-out header comment, the `import ... from "./types"` line, the `NOTE` comment block, the entire `export const ENGINES` array, the `native`/`partial`/`community` builders, and the `HF_VOL` constant. Replace that whole region with this block (it re-declares the builders + `HF_VOL`, which the `MODELS` body needs, but NOT `ENGINES` — that lives in `engines.ts`):

```ts
import type { EngineRecipe, ModelEntry } from "./types";

// Recipe builders.
const native = (r: Omit<EngineRecipe, "status">): EngineRecipe => ({ status: "native", ...r });
const partial = (r: Omit<EngineRecipe, "status">): EngineRecipe => ({ status: "partial", ...r });
// `community` = non-upstream: internally-built image and/or hot-patch.
const community = (r: Omit<EngineRecipe, "status">): EngineRecipe => ({ status: "community", ...r });

// Common HF cache volume snippet — single source of truth.
const HF_VOL = "-v $HOME/.cache/huggingface:/root/.cache/huggingface";
```

Keep everything from `export const MODELS: ModelEntry[] = [` to the end of the file unchanged. The result must contain exactly ONE declaration each of `native`, `partial`, `community`, and `HF_VOL` (the originals were inside the deleted region). Do NOT re-add `RecipeStatus`/`EngineMeta` imports — the `MODELS` body references only `EngineRecipe` and `ModelEntry`.

- [ ] **Step 4: Type-check the port**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm type-check`
Expected: no errors. If errors mention an unused import or a missing type, adjust the import line in `data.ts` to import exactly the types referenced.

- [ ] **Step 5: Run the data test to verify it passes**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/recipes/__tests__/data.test.ts`
Expected: PASS (all assertions).

- [ ] **Step 6: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/lib/recipes/data.ts web/src/lib/recipes/__tests__/data.test.ts && git commit -m "feat(recipes): port full ~35-model recipe catalog"
```

---

## Task 5: Add Mosaic-owned model size hints (`recipes/model-sizes.ts`)

**Files:**
- Create: `web/src/lib/recipes/model-sizes.ts`
- Test: `web/src/lib/recipes/__tests__/model-sizes.test.ts`

Recipes carry no numeric weight, so the fit-advisor needs its own lookup. `paramsB` = total parameter count in billions (used to estimate weight memory). The map is intentionally partial — the fit-advisor degrades gracefully when a model id is absent.

- [ ] **Step 1: Write the failing test** at `web/src/lib/recipes/__tests__/model-sizes.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { MODEL_SIZES } from "@/lib/recipes/model-sizes";
import { MODELS } from "@/lib/recipes/data";

describe("model sizes", () => {
  it("only keys real model ids", () => {
    const ids = new Set(MODELS.map((m) => m.id));
    for (const key of Object.keys(MODEL_SIZES)) {
      expect(ids.has(key)).toBe(true);
    }
  });
  it("gives Llama 3 a positive paramsB", () => {
    expect(MODEL_SIZES["llama-3"].paramsB).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/recipes/__tests__/model-sizes.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/src/lib/recipes/model-sizes.ts`**

`paramsB` is the largest common variant's total params (worst-case for fit). Verify each key exists in `MODELS` (Task 4 ids). Leave models without a clear single size out of the map.

```ts
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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/recipes/__tests__/model-sizes.test.ts`
Expected: PASS. If "only keys real model ids" fails, remove the offending key (its id is not in the port).

- [ ] **Step 5: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/lib/recipes/model-sizes.ts web/src/lib/recipes/__tests__/model-sizes.test.ts && git commit -m "feat(recipes): add model size hints for fit advisor"
```

---

## Task 6: Scenario mapping (`recipes/scenarios.ts`)

**Files:**
- Create: `web/src/lib/recipes/scenarios.ts`
- Test: `web/src/lib/recipes/__tests__/scenarios.test.ts`

Maps the six wizard scenarios to recipe categories and filters the catalog.

- [ ] **Step 1: Write the failing test** at `web/src/lib/recipes/__tests__/scenarios.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { SCENARIOS, getModelsForScenario } from "@/lib/recipes/scenarios";

describe("scenarios", () => {
  it("defines six scenarios", () => {
    expect(SCENARIOS).toHaveLength(6);
  });

  it("chat returns only dense models", () => {
    const models = getModelsForScenario("chat");
    expect(models.length).toBeGreaterThan(0);
    expect(models.every((m) => m.category === "dense")).toBe(true);
  });

  it("multimodal returns only vlm models", () => {
    const models = getModelsForScenario("multimodal");
    expect(models.every((m) => m.category === "vlm")).toBe(true);
  });

  it("returns [] for an unknown scenario id", () => {
    // @ts-expect-error testing runtime guard
    expect(getModelsForScenario("nope")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/recipes/__tests__/scenarios.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/src/lib/recipes/scenarios.ts`**

```ts
import type { CategoryId, ModelEntry } from "./types";
import { MODELS } from "./data";

export type ScenarioId =
  | "chat" | "rag" | "multimodal" | "diffusion" | "moe" | "embedding";

export interface Scenario {
  id: ScenarioId;
  label: string;
  icon: string;
  desc: string;
  categories: CategoryId[];
}

export const SCENARIOS: Scenario[] = [
  { id: "chat", label: "对话 / 助手", icon: "💬", desc: "通用聊天、指令遵循、Agent。稠密 LLM 为主。", categories: ["dense"] },
  { id: "rag", label: "RAG / 检索增强", icon: "📚", desc: "长上下文 LLM + 向量 + 重排组合。", categories: ["dense", "embedding", "rerank"] },
  { id: "multimodal", label: "多模态 / 视觉", icon: "🖼️", desc: "图文理解、文档解析。VLM 模型。", categories: ["vlm"] },
  { id: "diffusion", label: "图像生成", icon: "🎨", desc: "SDXL / FLUX / Qwen-Image 等扩散模型。", categories: ["diffusion"] },
  { id: "moe", label: "MoE 大模型", icon: "🧮", desc: "DeepSeek-V3 / Qwen3-MoE，极致性价比。", categories: ["moe"] },
  { id: "embedding", label: "向量 / 重排", icon: "🔢", desc: "BGE-M3 / Qwen3-Embedding / Reranker。", categories: ["embedding", "rerank"] },
];

export function getModelsForScenario(id: ScenarioId): ModelEntry[] {
  const scenario = SCENARIOS.find((s) => s.id === id);
  if (!scenario) return [];
  return MODELS.filter((m) => scenario.categories.includes(m.category));
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/recipes/__tests__/scenarios.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/lib/recipes/scenarios.ts web/src/lib/recipes/__tests__/scenarios.test.ts && git commit -m "feat(recipes): add scenario-to-model mapping"
```

---

## Task 7: GPU fit advisor (`fit-advisor.ts`)

**Files:**
- Create: `web/src/lib/fit-advisor.ts`
- Test: `web/src/lib/__tests__/fit-advisor.test.ts`

Pure function. Estimates weight memory at a precision, checks fit against `gpu.memory × count`, recommends tensor-parallel size, and flags whether quantization would help. Degrades to `knownSize:false` when the model has no size hint.

- [ ] **Step 1: Write the failing test** at `web/src/lib/__tests__/fit-advisor.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { advise } from "@/lib/fit-advisor";
import type { GPUInfo } from "@/types";

const a100: GPUInfo = {
  id: "a100-80gb", name: "A100 80GB", memory: 80, cudaCapability: "8.0",
  recommendedEngines: [], tier: "professional",
};

describe("fit-advisor", () => {
  it("flags a 70B model as not fitting on one 80GB card at fp16, and suggests quantization", () => {
    const r = advise("llama-3", a100, 1, "fp16");
    expect(r.knownSize).toBe(true);
    expect(r.fits).toBe(false);
    expect(r.recommendedTP).toBe(1); // capped at count
    expect(r.suggestQuantization).toBe(true);
  });

  it("recommends TP=3 for a 70B model across 4x A100 at fp16", () => {
    const r = advise("llama-3", a100, 4, "fp16");
    expect(r.fits).toBe(true);
    expect(r.recommendedTP).toBe(3); // ceil(168 / 80)
  });

  it("degrades gracefully for a model without a size hint", () => {
    const r = advise("llava-next", a100, 2, "fp16");
    expect(r.knownSize).toBe(false);
    expect(r.fits).toBeUndefined();
    expect(r.recommendedTP).toBe(1);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/__tests__/fit-advisor.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/src/lib/fit-advisor.ts`**

```ts
import type { GPUInfo } from "@/types";
import { MODEL_SIZES } from "@/lib/recipes/model-sizes";

export type Precision = "fp16" | "fp8" | "awq" | "gptq" | "gguf";

const BYTES_PER_PARAM: Record<Precision, number> = {
  fp16: 2, fp8: 1, awq: 0.5, gptq: 0.5, gguf: 0.5,
};
const OVERHEAD = 1.2; // KV cache + activation headroom

export interface FitResult {
  knownSize: boolean;
  availableGB: number;
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
    return { knownSize: false, availableGB, recommendedTP: 1, suggestQuantization: false };
  }

  const requiredGB = size.paramsB * BYTES_PER_PARAM[precision] * OVERHEAD;
  const fits = requiredGB <= availableGB;
  const recommendedTP = Math.min(cards, Math.max(1, Math.ceil(requiredGB / gpu.memory)));
  // Would the model fit on the same hardware if quantized to AWQ (0.5 B/param)?
  const quantRequiredGB = size.paramsB * BYTES_PER_PARAM.awq * OVERHEAD;
  const suggestQuantization = !fits && quantRequiredGB <= availableGB;

  return { knownSize: true, availableGB, requiredGB, fits, recommendedTP, suggestQuantization };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/__tests__/fit-advisor.test.ts`
Expected: PASS. (Check: 70B fp16 → 70×2×1.2 = 168GB. 1×80 → no fit, AWQ needs 70×0.5×1.2 = 42 ≤ 80 → suggest. 4×80=320 → fits, TP = ceil(168/80) = 3.)

- [ ] **Step 5: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/lib/fit-advisor.ts web/src/lib/__tests__/fit-advisor.test.ts && git commit -m "feat: add pure GPU fit advisor"
```

---

## Task 8: Command builder (`command-builder.ts`)

**Files:**
- Create: `web/src/lib/command-builder.ts`
- Test: `web/src/lib/__tests__/command-builder.test.ts`

Pure function. Takes a recipe's command and rewrites the tensor-parallel value to the advised TP. Returns `null` when the recipe has no command (e.g. TRT-LLM needs a pre-build step) so the UI can show notes/docUrl instead. Quantization-flag injection is intentionally out of scope here (Plan 3 / P4).

- [ ] **Step 1: Write the failing test** at `web/src/lib/__tests__/command-builder.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { buildCommand } from "@/lib/command-builder";
import type { EngineRecipe } from "@/lib/recipes/types";

const vllm: EngineRecipe = {
  status: "native",
  command: "docker run --gpus all \\\n  vllm/vllm-openai:v0.7.3 \\\n  --tensor-parallel-size 4",
};
const sglang: EngineRecipe = {
  status: "native",
  command: "python -m sglang.launch_server --tp 4",
};
const noCmd: EngineRecipe = { status: "native", notes: "needs trtllm-build" };

describe("command-builder", () => {
  it("rewrites --tensor-parallel-size for vllm", () => {
    expect(buildCommand(vllm, { tp: 2 })).toContain("--tensor-parallel-size 2");
  });
  it("rewrites --tp for sglang", () => {
    expect(buildCommand(sglang, { tp: 8 })).toContain("--tp 8");
  });
  it("returns the command unchanged when no opts given", () => {
    expect(buildCommand(vllm)).toBe(vllm.command);
  });
  it("returns null when the recipe has no command", () => {
    expect(buildCommand(noCmd, { tp: 2 })).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/__tests__/command-builder.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/src/lib/command-builder.ts`**

```ts
import type { EngineRecipe } from "@/lib/recipes/types";

export interface BuildOpts {
  /** Override tensor-parallel size in the command, if present. */
  tp?: number;
}

/**
 * Returns the recipe command with the tensor-parallel value rewritten to
 * `opts.tp` (handles both vLLM `--tensor-parallel-size N` and SGLang/LMDeploy
 * `--tp N`). Returns the command unchanged when no opts are given, and `null`
 * when the recipe carries no command (UI should show notes/docUrl instead).
 */
export function buildCommand(recipe: EngineRecipe, opts: BuildOpts = {}): string | null {
  if (!recipe.command) return null;
  let cmd = recipe.command;
  if (opts.tp != null) {
    cmd = cmd
      .replace(/(--tensor-parallel-size\s+)\d+/g, `$1${opts.tp}`)
      .replace(/(--tp\s+)\d+/g, `$1${opts.tp}`);
  }
  return cmd;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/__tests__/command-builder.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/lib/command-builder.ts web/src/lib/__tests__/command-builder.test.ts && git commit -m "feat: add pure command builder with TP rewrite"
```

---

## Task 9: Rewire the wizard (`page.tsx`) + delete stale modules

**Files:**
- Rewrite: `web/src/app/page.tsx`
- Modify: `web/src/types/index.ts` (remove dead `ModelInfo`/`EngineInfo`/`CommandConfig`/`GeneratedCommand`; keep `GPUInfo`)
- Delete: `web/src/lib/model-data.ts`, `web/src/lib/engine-data.ts`, `web/src/lib/command-generator.ts`
- Delete: `web/src/components/ModelSelector.tsx`, `EngineSelector.tsx`, `ParameterForm.tsx`, `CommandGenerator.tsx`, `GPUSelector.tsx` (old selectors; the new wizard renders inline for Plan 1, restyled in Plan 2)

No unit test for the React wiring in Plan 1 (no RTL installed); the automated gate is `pnpm type-check` + `pnpm build` (static export must succeed), plus a manual dev-server walkthrough. Component tests come with the Plan 2 UI work.

- [ ] **Step 1: Delete the stale modules and old selector components**

```bash
cd /Users/fangyong/agent/Mosaic/web && rm -f \
  src/lib/model-data.ts src/lib/engine-data.ts src/lib/command-generator.ts \
  src/components/GPUSelector.tsx src/components/ModelSelector.tsx \
  src/components/EngineSelector.tsx src/components/ParameterForm.tsx \
  src/components/CommandGenerator.tsx
```

- [ ] **Step 2: Trim `web/src/types/index.ts` to just `GPUInfo`**

Replace the entire file with:
```ts
// GPU 信息接口
export interface GPUInfo {
  id: string;
  name: string;
  memory: number; // GB
  cudaCapability: string;
  recommendedEngines: string[];
  tier: "entry" | "mid" | "high" | "professional";
}
```

- [ ] **Step 3: Rewrite `web/src/app/page.tsx`** as the scenario-first 5-step wizard (plain Tailwind; styling polish is Plan 2)

```tsx
"use client";

import { useState } from "react";
import type { GPUInfo } from "@/types";
import type { ModelEntry, EngineId, EngineRecipe } from "@/lib/recipes/types";
import { ENGINES } from "@/lib/recipes/engines";
import { SCENARIOS, getModelsForScenario, type ScenarioId } from "@/lib/recipes/scenarios";
import { gpuData } from "@/lib/gpu-data";
import { advise } from "@/lib/fit-advisor";
import { buildCommand } from "@/lib/command-builder";

const STEPS = ["场景", "模型", "引擎", "GPU 校验", "配方命令"];

export default function Home() {
  const [step, setStep] = useState(0);
  const [scenario, setScenario] = useState<ScenarioId | null>(null);
  const [model, setModel] = useState<ModelEntry | null>(null);
  const [engineId, setEngineId] = useState<EngineId | null>(null);
  const [gpu, setGpu] = useState<GPUInfo | null>(null);
  const [count, setCount] = useState(1);

  const models = scenario ? getModelsForScenario(scenario) : [];
  const recipe: EngineRecipe | undefined =
    model && engineId ? model.engines[engineId] : undefined;
  const fit = model && gpu ? advise(model.id, gpu, count) : null;
  const command = recipe ? buildCommand(recipe, fit ? { tp: fit.recommendedTP } : {}) : null;

  const engineName = (id: EngineId) => ENGINES.find((e) => e.id === id)?.name ?? id;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <h1 className="text-3xl font-bold mb-2">ModelRun.io</h1>
      <p className="text-slate-400 mb-6">从场景出发,生成可跑的部署命令</p>

      <ol className="flex gap-2 mb-8 text-sm">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? "text-cyan-400 font-semibold" : "text-slate-500"}>
            {i + 1}. {s}{i < STEPS.length - 1 ? " ›" : ""}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => { setScenario(s.id); setModel(null); setEngineId(null); setStep(1); }}
              className={`text-left p-5 rounded-xl border ${scenario === s.id ? "border-cyan-400" : "border-slate-700"} hover:border-cyan-400`}
            >
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="font-semibold">{s.label}</div>
              <div className="text-sm text-slate-400 mt-1">{s.desc}</div>
            </button>
          ))}
        </section>
      )}

      {step === 1 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((m) => (
            <button
              key={m.id}
              onClick={() => { setModel(m); setEngineId(null); setStep(2); }}
              className={`text-left p-5 rounded-xl border ${model?.id === m.id ? "border-cyan-400" : "border-slate-700"} hover:border-cyan-400`}
            >
              <div className="font-semibold">{m.name}</div>
              <div className="text-sm text-slate-400 mt-1">{m.meta}</div>
            </button>
          ))}
        </section>
      )}

      {step === 2 && model && (
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(Object.keys(model.engines) as EngineId[]).map((id) => {
            const r = model.engines[id]!;
            return (
              <button
                key={id}
                onClick={() => { setEngineId(id); setStep(3); }}
                className={`text-left p-4 rounded-xl border ${engineId === id ? "border-cyan-400" : "border-slate-700"} hover:border-cyan-400`}
              >
                <div className="font-semibold">{engineName(id)}</div>
                <div className="text-xs mt-1 inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300">{r.status}</div>
              </button>
            );
          })}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4 max-w-xl">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gpuData.map((g) => (
              <button
                key={g.id}
                onClick={() => setGpu(g)}
                className={`text-left p-3 rounded-lg border ${gpu?.id === g.id ? "border-cyan-400" : "border-slate-700"} hover:border-cyan-400`}
              >
                <div className="font-medium text-sm">{g.name}</div>
                <div className="text-xs text-slate-400">{g.memory} GB</div>
              </button>
            ))}
          </div>
          <label className="block text-sm">
            卡数:
            <input type="number" min={1} value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
              className="ml-2 w-20 bg-slate-800 rounded px-2 py-1" />
          </label>
          {fit && (
            <div className="text-sm text-slate-300 rounded-lg bg-slate-900 p-4">
              {fit.knownSize ? (
                <>
                  <div>需要约 {fit.requiredGB?.toFixed(0)} GB / 可用 {fit.availableGB} GB — {fit.fits ? "✅ 跑得动" : "⚠️ 显存不足"}</div>
                  <div>推荐 tensor-parallel-size: {fit.recommendedTP}</div>
                  {fit.suggestQuantization && <div className="text-amber-400">建议使用量化(AWQ/FP8)以放入当前显存</div>}
                </>
              ) : (
                <div>该模型暂无显存估算,请参考下一步配方中的资源建议。</div>
              )}
            </div>
          )}
          <button disabled={!gpu} onClick={() => setStep(4)}
            className="px-5 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold disabled:opacity-40">
            查看配方 →
          </button>
        </section>
      )}

      {step === 4 && recipe && (
        <section className="space-y-4 max-w-3xl">
          {command ? (
            <pre className="bg-black rounded-xl p-4 overflow-x-auto text-sm text-emerald-300 whitespace-pre">{command}</pre>
          ) : (
            <div className="rounded-xl bg-slate-900 p-4 text-slate-300">
              该引擎需预处理,暂无一键命令。{recipe.notes ?? ""}
            </div>
          )}
          {recipe.params && recipe.params.length > 0 && (
            <ul className="text-sm space-y-1">
              {recipe.params.map((p) => (
                <li key={p.key}><code className="text-cyan-400">{p.key} {p.value}</code> — <span className="text-slate-400">{p.desc}</span></li>
              ))}
            </ul>
          )}
          {recipe.resource && <p className="text-sm text-slate-400">资源建议:{recipe.resource}</p>}
          {recipe.notes && <p className="text-sm text-amber-300">⚠️ {recipe.notes}</p>}
          {recipe.docUrl && <a className="text-sm text-cyan-400 underline" href={recipe.docUrl} target="_blank" rel="noreferrer">官方文档 ↗</a>}
        </section>
      )}

      {step > 0 && (
        <button onClick={() => setStep(step - 1)} className="mt-8 text-sm text-slate-400 hover:text-slate-200">← 上一步</button>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Type-check**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm type-check`
Expected: no errors. If `layout.tsx` or any leftover file imports a deleted module, remove that import.

- [ ] **Step 5: Run the full test suite**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test`
Expected: all tests pass.

- [ ] **Step 6: Verify the static export builds**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm build`
Expected: build completes, `out/` produced, no errors about missing modules.

- [ ] **Step 7: Manual dev-server walkthrough**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm dev`, open http://localhost:3000, and confirm:
- Step 1 shows 6 scenario cards; clicking "对话 / 助手" advances to models.
- Step 2 shows only dense models; clicking one advances to engines.
- Step 3 shows only that model's engines with a status badge.
- Step 4 lets you pick a GPU + count and shows a fit verdict.
- Step 5 shows a command whose `--tensor-parallel-size` matches the recommended TP, plus params/notes/docUrl.
Stop the server with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add -A && git commit -m "feat: scenario-first wizard wired to recipe data (plain UI)"
```

---

## Self-Review

**Spec coverage (Plan 1 = P0 + P1):**
- P0 data foundation → Tasks 2 (types + inlined EngineId), 3 (engines), 4 (full data port). ✓
- P1 scenario mapping → Task 6. ✓
- P1 fit-advisor → Task 7. ✓
- P1 command-builder (TP rewrite; quant deferred to P4 per spec) → Task 8. ✓
- P1 five-step state machine (plain styling) → Task 9. ✓
- Test infra prerequisite (not in spec, discovered: no runner installed) → Task 1. ✓
- model-sizes.ts (refinement: recipes carry no numeric weight; spec's fit-advisor needs a size source) → Task 5. ✓ Noted as a deviation from the spec's `(ModelEntry, GPUInfo, count)` signature — `advise` takes `modelId` and looks up size internally.
- Out of scope for Plan 1 (correct): aurora UI (Plan 2, P2/P3), GPU list extension + quant injection (Plan 3, P4), overview page/SEO/deploy (Plan 4, P5).

**Placeholder scan:** No TBD/TODO; every code step has complete code; the only "copy verbatim" step (Task 4) gives exact transformation rules + a count/shape test as the gate. ✓

**Type consistency:** `EngineRecipe`/`ModelEntry`/`EngineId`/`CategoryId` defined in Task 2 are used identically in Tasks 3–9. `advise(modelId, gpu, count, precision)` signature matches between Task 7 definition and Task 9 caller. `buildCommand(recipe, {tp})` matches between Task 8 and Task 9. `getModelsForScenario(id)` / `SCENARIOS` / `ScenarioId` match between Task 6 and Task 9. `FitResult` fields (`knownSize`, `requiredGB`, `availableGB`, `fits`, `recommendedTP`, `suggestQuantization`) used in Task 9 all exist in Task 7. ✓
