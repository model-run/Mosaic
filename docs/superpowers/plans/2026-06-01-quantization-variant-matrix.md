# Quantization Variant Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users switch quantization precision (FP16/FP8/AWQ/GPTQ/GGUF) on the step-5 recipe card and get the matching deploy command + VRAM fit estimate, live.

**Architecture:** Pure-static, pure-function additions on top of the existing `recipes/* data + thin compute layer` boundary. An engine capability table (`QUANT_SUPPORT`) decides which precisions a cell exposes; a resolver (`resolveVariant`) returns display fields via three branches — base passthrough, hand-written `variants[p]` override, or computed (command-builder appends an engine-specific quant flag). The step-5 card gets a precision chip row; `precision` state lives in `page.tsx`.

**Tech Stack:** Next.js 14 (static export), TypeScript, Tailwind, Vitest + React Testing Library, pnpm.

---

### Task 1: Centralize `Precision` type and add variant data model

**Files:**
- Modify: `web/src/lib/recipes/types.ts` (append `Precision`, `QuantVariant`; add `variants?` to `EngineRecipe`)
- Modify: `web/src/lib/fit-advisor.ts:4` (import `Precision` from types, delete local definition)
- Test: `web/src/lib/__tests__/fit-advisor.test.ts` (already exists — used to confirm no regression)

- [ ] **Step 1: Add types to `recipes/types.ts`**

Append to `web/src/lib/recipes/types.ts` (after the existing `EngineMeta` / before or after `RecipeParam` — placement doesn't matter, but keep `Precision` near the top exports):

```ts
/** Quantization precisions the matrix can expose. */
export type Precision = "fp16" | "fp8" | "awq" | "gptq" | "gguf";

/**
 * Hand-written override for a specific precision. Any field provided replaces
 * the corresponding base recipe field wholesale; omitted fields fall back to base.
 */
export interface QuantVariant {
  image?: string;
  command?: string;
  params?: RecipeParam[];
  resource?: string;
  notes?: string;
}
```

Then add the `variants` field to the existing `EngineRecipe` interface:

```ts
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
```

- [ ] **Step 2: Point `fit-advisor` at the shared `Precision`**

In `web/src/lib/fit-advisor.ts`, replace the local definition. The current top reads:

```ts
import type { GPUInfo } from "@/types";
import { MODEL_SIZES } from "@/lib/recipes/model-sizes";

export type Precision = "fp16" | "fp8" | "awq" | "gptq" | "gguf";
```

Change it to:

```ts
import type { GPUInfo } from "@/types";
import { MODEL_SIZES } from "@/lib/recipes/model-sizes";
import type { Precision } from "@/lib/recipes/types";

export type { Precision };
```

(`export type { Precision }` keeps existing `import { Precision } from "@/lib/fit-advisor"` consumers working — no need to chase every import site.)

- [ ] **Step 3: Run type-check + existing tests to confirm no regression**

Run: `cd web && pnpm type-check && pnpm test -- fit-advisor`
Expected: type-check passes; fit-advisor tests PASS (behavior unchanged).

- [ ] **Step 4: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/lib/recipes/types.ts web/src/lib/fit-advisor.ts && git commit -m "feat(recipes): add Precision/QuantVariant types and EngineRecipe.variants"
```

---

### Task 2: Engine capability table (`QUANT_SUPPORT`)

**Files:**
- Create: `web/src/lib/recipes/quant-support.ts`
- Test: `web/src/lib/recipes/__tests__/quant-support.test.ts`

- [ ] **Step 1: Write the failing test**

Create `web/src/lib/recipes/__tests__/quant-support.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { QUANT_SUPPORT } from "@/lib/recipes/quant-support";
import type { EngineId } from "@/lib/recipes/types";

const ALL_ENGINES: EngineId[] = [
  "vllm", "vllm-ascend", "sglang", "trtllm", "mindie",
  "lmdeploy", "tgi", "tei", "infinity", "llamacpp", "comfyui",
];

describe("QUANT_SUPPORT", () => {
  it("covers every EngineId", () => {
    for (const id of ALL_ENGINES) {
      expect(QUANT_SUPPORT[id], `missing ${id}`).toBeDefined();
    }
    expect(Object.keys(QUANT_SUPPORT).sort()).toEqual([...ALL_ENGINES].sort());
  });

  it("lists fp16 first for every engine", () => {
    for (const id of ALL_ENGINES) {
      expect(QUANT_SUPPORT[id][0], `${id} must start with fp16`).toBe("fp16");
    }
  });

  it("exposes the expected vllm precisions", () => {
    expect(QUANT_SUPPORT.vllm).toEqual(["fp16", "fp8", "awq", "gptq"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test -- quant-support`
Expected: FAIL — cannot resolve `@/lib/recipes/quant-support`.

- [ ] **Step 3: Create the table**

Create `web/src/lib/recipes/quant-support.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && pnpm test -- quant-support`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/lib/recipes/quant-support.ts web/src/lib/recipes/__tests__/quant-support.test.ts && git commit -m "feat(recipes): add QUANT_SUPPORT engine capability table"
```

---

### Task 3: Extend `command-builder` with quantization flags

**Files:**
- Modify: `web/src/lib/command-builder.ts`
- Test: `web/src/lib/__tests__/command-builder.test.ts` (extend)

- [ ] **Step 1: Write the failing tests**

Append these cases inside the existing `describe("command-builder", ...)` block in `web/src/lib/__tests__/command-builder.test.ts`. Also add a `lmdeploy` fixture next to the existing `vllm`/`sglang` fixtures at the top of the file:

```ts
const lmdeploy: EngineRecipe = {
  status: "native",
  command: "lmdeploy serve api_server Qwen/Qwen2.5-7B --tp 1",
};
const tgi: EngineRecipe = {
  status: "native",
  command: "docker run ghcr.io/huggingface/text-generation-inference --model-id X",
};
```

```ts
it("appends --quantization for vllm when quantization given", () => {
  expect(buildCommand(vllm, { quantization: "awq" })).toContain("--quantization awq");
});
it("appends --quantization for sglang", () => {
  expect(buildCommand(sglang, { quantization: "fp8", engineId: "sglang" })).toContain("--quantization fp8");
});
it("appends --quantize for tgi", () => {
  expect(buildCommand(tgi, { quantization: "gptq", engineId: "tgi" })).toContain("--quantize gptq");
});
it("appends --model-format awq --quant-policy 4 for lmdeploy awq", () => {
  const out = buildCommand(lmdeploy, { quantization: "awq", engineId: "lmdeploy" })!;
  expect(out).toContain("--model-format awq");
  expect(out).toContain("--quant-policy 4");
});
it("does not touch the command for fp16 (base)", () => {
  expect(buildCommand(vllm, { quantization: "fp16", engineId: "vllm" })).toBe(vllm.command);
});
it("does not touch the command for gguf (llamacpp file-based)", () => {
  const llama: EngineRecipe = { status: "native", command: "llama-server -m model.gguf" };
  expect(buildCommand(llama, { quantization: "gguf", engineId: "llamacpp" })).toBe(llama.command);
});
it("replaces an existing --quantization value rather than duplicating", () => {
  const r: EngineRecipe = { status: "native", command: "vllm serve X --quantization awq" };
  const out = buildCommand(r, { quantization: "gptq", engineId: "vllm" })!;
  expect(out).toContain("--quantization gptq");
  expect(out).not.toContain("awq");
});
it("leaves the command unchanged for an engine with no quant rule", () => {
  const r: EngineRecipe = { status: "native", command: "text-embeddings-router --model-id X" };
  expect(buildCommand(r, { quantization: "fp8", engineId: "tei" })).toBe(r.command);
});
```

Note: existing tests call `buildCommand(vllm, { tp: 2 })` with no `engineId`. The vllm `--quantization` flag is engine-agnostic for vllm/sglang (both use `--quantization`), so the first vllm test above omits `engineId` deliberately — the builder must default the vllm-style flag when `engineId` is absent. Keep that behavior.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && pnpm test -- command-builder`
Expected: FAIL — `quantization`/`engineId` not handled.

- [ ] **Step 3: Rewrite `command-builder.ts`**

Replace the entire contents of `web/src/lib/command-builder.ts`:

```ts
import type { EngineRecipe, EngineId, Precision } from "@/lib/recipes/types";

export interface BuildOpts {
  /** Override tensor-parallel size in the command, if present. */
  tp?: number;
  /** Target quantization. "fp16" / undefined leaves quantization untouched. */
  quantization?: Precision;
  /** Engine the recipe belongs to — selects the quant-flag rule. */
  engineId?: EngineId;
}

/** Set or replace a single-valued flag (`--flag VALUE`). Appends if absent. */
function setFlag(cmd: string, flag: string, value: string): string {
  const re = new RegExp(`(${flag}\\s+)\\S+`);
  if (re.test(cmd)) return cmd.replace(re, `$1${value}`);
  return `${cmd} ${flag} ${value}`;
}

/**
 * Returns the recipe command with tensor-parallel and quantization rewritten.
 * - tp: rewrites `--tensor-parallel-size N` / `--tp N` in place.
 * - quantization: appends the engine-specific quant flag. "fp16"/undefined and
 *   engines with no rule leave the command unchanged (degrade-safe).
 * Returns null when the recipe carries no command.
 */
export function buildCommand(recipe: EngineRecipe, opts: BuildOpts = {}): string | null {
  if (!recipe.command) return null;
  let cmd = recipe.command;

  if (opts.tp != null) {
    cmd = cmd
      .replace(/(--tensor-parallel-size\s+)\d+/g, `$1${opts.tp}`)
      .replace(/(--tp\s+)\d+/g, `$1${opts.tp}`);
  }

  const q = opts.quantization;
  if (q && q !== "fp16") {
    cmd = applyQuant(cmd, q, opts.engineId);
  }
  return cmd;
}

function applyQuant(cmd: string, q: Precision, engineId?: EngineId): string {
  // vllm/sglang share `--quantization`; default to it when engineId is absent.
  const eng = engineId ?? "vllm";
  switch (eng) {
    case "vllm":
    case "vllm-ascend":
    case "sglang":
    case "trtllm":
    case "mindie":
      return setFlag(cmd, "--quantization", q);
    case "tgi":
      return setFlag(cmd, "--quantize", q);
    case "lmdeploy":
      // lmdeploy expresses weight-only quant via model-format + quant-policy.
      return q === "awq" || q === "gptq"
        ? setFlag(setFlag(cmd, "--model-format", q), "--quant-policy", "4")
        : cmd;
    case "llamacpp": // gguf is carried by the model file, not a flag
    case "tei":
    case "infinity":
    case "comfyui":
    default:
      return cmd;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web && pnpm test -- command-builder`
Expected: PASS (all existing + new cases).

- [ ] **Step 5: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/lib/command-builder.ts web/src/lib/__tests__/command-builder.test.ts && git commit -m "feat(command-builder): append engine-specific quantization flags"
```

---

### Task 4: Quant resolver (`resolveVariant` + `availablePrecisions`)

**Files:**
- Create: `web/src/lib/quant-resolver.ts`
- Test: `web/src/lib/__tests__/quant-resolver.test.ts`

- [ ] **Step 1: Write the failing test**

Create `web/src/lib/__tests__/quant-resolver.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveVariant, availablePrecisions } from "@/lib/quant-resolver";
import type { EngineRecipe } from "@/lib/recipes/types";

const vllm: EngineRecipe = {
  status: "native",
  image: "vllm/vllm-openai:v0.7.3",
  command: "vllm serve Qwen/Qwen2.5-7B --tensor-parallel-size 1",
  params: [{ key: "--tensor-parallel-size", value: "1", desc: "张量并行度" }],
  notes: "首次拉取镜像较慢",
};
const withOverride: EngineRecipe = {
  ...vllm,
  variants: {
    fp8: { image: "vllm/vllm-openai:fp8", command: "vllm serve X --quantization fp8 --kv-cache-dtype fp8", notes: "实测 FP8 配方" },
  },
};
const noCmd: EngineRecipe = { status: "partial", notes: "TRT-LLM 需预编译" };

describe("availablePrecisions", () => {
  it("returns only fp16 for a command-less recipe", () => {
    expect(availablePrecisions(noCmd, "trtllm")).toEqual(["fp16"]);
  });
  it("returns engine-supported precisions when the recipe has a command", () => {
    expect(availablePrecisions(vllm, "vllm")).toEqual(["fp16", "fp8", "awq", "gptq"]);
  });
  it("includes a precision that has a hand-written variant even without a base command", () => {
    const onlyVariant: EngineRecipe = { status: "native", variants: { awq: { command: "x --quantization awq" } } };
    expect(availablePrecisions(onlyVariant, "lmdeploy")).toEqual(["fp16", "awq"]);
  });
});

describe("resolveVariant", () => {
  it("returns base fields unchanged for fp16", () => {
    const r = resolveVariant(vllm, "vllm", "fp16", { tp: 2 });
    expect(r.computed).toBe(false);
    expect(r.command).toContain("--tensor-parallel-size 2");
    expect(r.image).toBe("vllm/vllm-openai:v0.7.3");
    expect(r.notes).toBe("首次拉取镜像较慢");
  });
  it("prefers a hand-written override when present", () => {
    const r = resolveVariant(withOverride, "vllm", "fp8", { tp: 1 });
    expect(r.computed).toBe(false);
    expect(r.command).toContain("--kv-cache-dtype fp8");
    expect(r.image).toBe("vllm/vllm-openai:fp8");
    expect(r.notes).toBe("实测 FP8 配方");
  });
  it("computes a variant by appending the quant flag and a non-empirical note", () => {
    const r = resolveVariant(vllm, "vllm", "awq", { tp: 1 });
    expect(r.computed).toBe(true);
    expect(r.command).toContain("--quantization awq");
    expect(r.notes).toContain("非实测");
    expect(r.image).toBe("vllm/vllm-openai:v0.7.3"); // base image kept
    expect(r.params?.some((p) => p.key === "--quantization")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && pnpm test -- quant-resolver`
Expected: FAIL — cannot resolve `@/lib/quant-resolver`.

- [ ] **Step 3: Create the resolver**

Create `web/src/lib/quant-resolver.ts`:

```ts
import type { EngineId, EngineRecipe, Precision, RecipeParam } from "@/lib/recipes/types";
import { QUANT_SUPPORT } from "@/lib/recipes/quant-support";
import { buildCommand } from "@/lib/command-builder";

export interface ResolvedRecipe {
  command: string | null;
  image?: string;
  params?: RecipeParam[];
  resource?: string;
  notes?: string;
  /** true when the command was derived by rule rather than base/hand-written. */
  computed: boolean;
}

const COMPUTED_NOTE =
  "量化命令为按引擎规则推导，非实测，请以官方文档为准。";

/**
 * Precisions the UI should offer for this cell, in QUANT_SUPPORT order.
 * fp16 is always present; a non-fp16 precision is offered when the recipe has a
 * base command (computable) or a hand-written variant for it.
 */
export function availablePrecisions(recipe: EngineRecipe, engineId: EngineId): Precision[] {
  const supported = QUANT_SUPPORT[engineId] ?? ["fp16"];
  return supported.filter(
    (p) => p === "fp16" || recipe.variants?.[p] != null || recipe.command != null,
  );
}

/** Resolve the display fields for a given precision: base / override / computed. */
export function resolveVariant(
  recipe: EngineRecipe,
  engineId: EngineId,
  precision: Precision,
  opts: { tp?: number } = {},
): ResolvedRecipe {
  // 1. base
  if (precision === "fp16") {
    return {
      command: buildCommand(recipe, { tp: opts.tp }),
      image: recipe.image,
      params: recipe.params,
      resource: recipe.resource,
      notes: recipe.notes,
      computed: false,
    };
  }

  // 2. hand-written override (merged over base)
  const ov = recipe.variants?.[precision];
  if (ov) {
    const merged: EngineRecipe = { ...recipe, command: ov.command ?? recipe.command };
    return {
      command: buildCommand(merged, { tp: opts.tp }),
      image: ov.image ?? recipe.image,
      params: ov.params ?? recipe.params,
      resource: ov.resource ?? recipe.resource,
      notes: ov.notes ?? recipe.notes,
      computed: false,
    };
  }

  // 3. computed
  const command = buildCommand(recipe, { tp: opts.tp, quantization: precision, engineId });
  const quantParam: RecipeParam = {
    key: "--quantization",
    value: precision,
    desc: `量化精度（推导）：${precision}`,
  };
  return {
    command,
    image: recipe.image,
    params: [...(recipe.params ?? []), quantParam],
    resource: recipe.resource,
    notes: recipe.notes ? `${recipe.notes}；${COMPUTED_NOTE}` : COMPUTED_NOTE,
    computed: true,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && pnpm test -- quant-resolver`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/lib/quant-resolver.ts web/src/lib/__tests__/quant-resolver.test.ts && git commit -m "feat(quant-resolver): base/override/computed variant resolution"
```

---

### Task 5: Precision chip row in `RecipeCard`

**Files:**
- Modify: `web/src/components/RecipeCard.tsx`
- Modify: `web/src/app/globals.css` (add `.quant-chip` styles)
- Test: `web/src/components/__tests__/RecipeCard.test.tsx` (extend)

This task makes `RecipeCard` render a chip row when given `precisions`/`precision`/`onPrecisionChange`, and shows a "非实测" tag when `computed`. The card keeps working with no chips when only `["fp16"]` is available.

- [ ] **Step 1: Add chip styles to `globals.css`**

Append inside the existing `@layer components { … }` block in `web/src/app/globals.css` (right after the `.option-card.is-selected { … }` rule):

```css
  .quant-chip {
    @apply cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200;
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.12);
    color: rgb(203, 213, 225);
  }
  .quant-chip:hover {
    border-color: rgba(124, 58, 237, 0.55);
    color: rgb(241, 245, 249);
  }
  .quant-chip.is-selected {
    border-color: #22d3ee;
    color: #67e8f9;
    background: rgba(34, 211, 238, 0.12);
    box-shadow: 0 0 0 1px #22d3ee;
  }
```

- [ ] **Step 2: Write the failing tests**

Replace the contents of `web/src/components/__tests__/RecipeCard.test.tsx` with (keeps the two existing assertions, adds chip-row coverage):

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecipeCard } from "@/components/RecipeCard";
import type { EngineRecipe } from "@/lib/recipes/types";

const full: EngineRecipe = {
  status: "native",
  image: "vllm/vllm-openai:v0.7.3",
  command: "docker run --tp 8",
  params: [{ key: "--tp", value: "8", desc: "张量并行度" }],
  resource: "需 8×H100",
  notes: "首次拉取镜像较慢",
  docUrl: "https://docs.vllm.ai",
};

const noCommand: EngineRecipe = {
  status: "partial",
  notes: "TensorRT-LLM 需先 trtllm-build 预编译引擎",
  docUrl: "https://nvidia.github.io/TensorRT-LLM",
};

describe("RecipeCard", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it("renders the full recipe: badge, command, params, notes, docUrl", () => {
    render(<RecipeCard engineName="vLLM" recipe={full} command={full.command!} />);
    expect(screen.getByText("原生支持")).toBeInTheDocument();
    expect(screen.getByText("复制")).toBeInTheDocument();
    expect(screen.getByText("张量并行度")).toBeInTheDocument();
    expect(screen.getByText(/已知坑/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /官方文档/ })).toHaveAttribute("href", "https://docs.vllm.ai");
  });

  it("degrades when there is no command: shows a note, no copy button", () => {
    render(<RecipeCard engineName="TensorRT-LLM" recipe={noCommand} command={null} />);
    expect(screen.queryByText("复制")).not.toBeInTheDocument();
    expect(screen.getByText(/暂无一键命令/)).toBeInTheDocument();
    expect(screen.getByText(/TensorRT-LLM 需先 trtllm-build/)).toBeInTheDocument();
  });

  it("renders a precision chip per available precision and calls onPrecisionChange", () => {
    const onChange = vi.fn();
    render(
      <RecipeCard
        engineName="vLLM"
        recipe={full}
        command={full.command!}
        precisions={["fp16", "fp8", "awq"]}
        precision="fp16"
        onPrecisionChange={onChange}
      />,
    );
    expect(screen.getByRole("button", { name: "FP8" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "AWQ" }));
    expect(onChange).toHaveBeenCalledWith("awq");
  });

  it("hides the chip row when only fp16 is available", () => {
    render(
      <RecipeCard engineName="vLLM" recipe={full} command={full.command!} precisions={["fp16"]} precision="fp16" />,
    );
    expect(screen.queryByRole("button", { name: "FP16" })).not.toBeInTheDocument();
  });

  it("shows a non-empirical tag when computed is true", () => {
    render(
      <RecipeCard
        engineName="vLLM" recipe={full} command={full.command!}
        precisions={["fp16", "awq"]} precision="awq" computed
      />,
    );
    expect(screen.getByText(/非实测/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd web && pnpm test -- RecipeCard`
Expected: FAIL — new props not accepted; chips/tag absent.

- [ ] **Step 4: Rewrite `RecipeCard.tsx`**

Replace the entire contents of `web/src/components/RecipeCard.tsx`:

```tsx
import type { EngineRecipe, Precision } from "@/lib/recipes/types";
import { CommandBlock } from "@/components/CommandBlock";
import { StatusBadge } from "@/components/StatusBadge";

const PRECISION_LABEL: Record<Precision, string> = {
  fp16: "FP16", fp8: "FP8", awq: "AWQ", gptq: "GPTQ", gguf: "GGUF",
};

export function RecipeCard({
  engineName,
  recipe,
  command,
  precisions,
  precision,
  onPrecisionChange,
  computed,
}: {
  engineName: string;
  recipe: EngineRecipe;
  command: string | null;
  precisions?: Precision[];
  precision?: Precision;
  onPrecisionChange?: (p: Precision) => void;
  computed?: boolean;
}) {
  const showChips = precisions != null && precisions.length > 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold text-slate-100">{engineName}</h3>
        <StatusBadge status={recipe.status} />
        {recipe.image && <code className="text-xs text-slate-400">{recipe.image}</code>}
      </div>

      {showChips && (
        <div className="flex flex-wrap items-center gap-2">
          {precisions!.map((p) => (
            <button
              key={p}
              type="button"
              className={`quant-chip${p === precision ? " is-selected" : ""}`}
              aria-pressed={p === precision}
              onClick={() => onPrecisionChange?.(p)}
            >
              {PRECISION_LABEL[p]}
            </button>
          ))}
          {computed && <span className="text-xs text-amber-300">推导命令 · 非实测</span>}
        </div>
      )}

      {command ? (
        <CommandBlock command={command} />
      ) : (
        <div className="degraded-note">
          该配方需预编译 / 预处理，暂无一键命令。请参考下方说明与官方文档。
          {recipe.notes ? `（${recipe.notes}）` : ""}
        </div>
      )}

      {recipe.params && recipe.params.length > 0 && (
        <ul className="param-list">
          {recipe.params.map((p) => (
            <li key={p.key}>
              <code className="text-cyan-300">
                {p.key} {p.value}
              </code>
              <span className="text-slate-400"> — </span>
              <span className="text-slate-400">{p.desc}</span>
            </li>
          ))}
        </ul>
      )}

      {recipe.resource && <p className="text-sm text-slate-400">资源建议：{recipe.resource}</p>}
      {command && recipe.notes && <p className="text-sm text-amber-300">⚠️ 已知坑：{recipe.notes}</p>}
      {recipe.docUrl && (
        <a
          className="text-sm text-cyan-300 underline underline-offset-2"
          href={recipe.docUrl}
          target="_blank"
          rel="noreferrer"
        >
          官方文档 ↗
        </a>
      )}
    </div>
  );
}
```

Note: `params`/`notes`/`image`/`resource` are read from the `recipe` prop. The caller (Task 7) passes the **resolved** recipe object (base merged with the variant fields) as `recipe`, so the card needs no resolver knowledge.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd web && pnpm test -- RecipeCard`
Expected: PASS (all 5 tests).

- [ ] **Step 6: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/components/RecipeCard.tsx web/src/app/globals.css web/src/components/__tests__/RecipeCard.test.tsx && git commit -m "feat(ui): precision chip row + non-empirical tag on RecipeCard"
```

---

### Task 6: Thread precision through `StepRecipe`

**Files:**
- Modify: `web/src/components/steps/StepRecipe.tsx`

- [ ] **Step 1: Rewrite `StepRecipe.tsx`**

Replace the entire contents of `web/src/components/steps/StepRecipe.tsx`:

```tsx
import type { EngineRecipe, Precision } from "@/lib/recipes/types";
import { RecipeCard } from "@/components/RecipeCard";

export function StepRecipe({
  engineName,
  recipe,
  command,
  precisions,
  precision,
  onPrecisionChange,
  computed,
}: {
  engineName: string;
  recipe: EngineRecipe;
  command: string | null;
  precisions: Precision[];
  precision: Precision;
  onPrecisionChange: (p: Precision) => void;
  computed: boolean;
}) {
  return (
    <div>
      <div className="step-label">STEP 05</div>
      <h2 className="step-q">复制即可运行的配方</h2>
      <RecipeCard
        engineName={engineName}
        recipe={recipe}
        command={command}
        precisions={precisions}
        precision={precision}
        onPrecisionChange={onPrecisionChange}
        computed={computed}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check (no test for this thin wrapper)**

Run: `cd web && pnpm type-check`
Expected: FAIL only at `page.tsx` (StepRecipe call site missing new props) — that's fixed in Task 7. `StepRecipe.tsx` itself type-checks.

- [ ] **Step 3: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/components/steps/StepRecipe.tsx && git commit -m "feat(ui): pass precision props through StepRecipe"
```

---

### Task 7: Wire precision state into `page.tsx`

**Files:**
- Modify: `web/src/app/page.tsx`

- [ ] **Step 1: Update imports**

In `web/src/app/page.tsx`, change the type import on line 5 and add the resolver/precision imports. Replace lines 5–9:

```ts
import type { ModelEntry, EngineId, EngineRecipe, Precision } from "@/lib/recipes/types";
import { engineName } from "@/lib/recipes/engines";
import { getModelsForScenario, type ScenarioId } from "@/lib/recipes/scenarios";
import { advise } from "@/lib/fit-advisor";
import { resolveVariant, availablePrecisions } from "@/lib/quant-resolver";
```

(Removes the direct `buildCommand` import — the resolver owns command building now.)

- [ ] **Step 2: Add precision state and reset on model/engine change**

Add a `precision` state alongside the others. Replace line 25 (`const [count, setCount] = useState(1);`) with:

```ts
  const [count, setCount] = useState(1);
  const [precision, setPrecision] = useState<Precision>("fp16");
```

Then reset `precision` to `"fp16"` wherever `engineId` changes. In the `StepModel` `onSelect` (currently sets model + clears engine) and the `StepEngine` `onSelect`, add `setPrecision("fp16");`. Concretely:

- In `StepModel onSelect` (currently `setModel(m); setEngineId(null); setStep(2);`) → add `setPrecision("fp16");`.
- In `StepEngine onSelect` (currently `setEngineId(id); setStep(3);`) → add `setPrecision("fp16");`.

- [ ] **Step 3: Replace the derived `command`/recipe wiring**

Replace lines 28–30 (`recipe` / `fit` / `command`) with:

```ts
  const recipe: EngineRecipe | undefined = model && engineId ? model.engines[engineId] : undefined;
  const fit = model && gpu ? advise(model.id, gpu, count, precision) : null;
  const precisions: Precision[] =
    recipe && engineId ? availablePrecisions(recipe, engineId) : ["fp16"];
  const resolved =
    recipe && engineId
      ? resolveVariant(recipe, engineId, precision, fit ? { tp: fit.recommendedTP } : {})
      : null;
```

- [ ] **Step 4: Update the `StepRecipe` render**

Replace the step-4 block (currently lines 83–85):

```tsx
              {step === 4 && recipe && engineId && resolved && (
                <StepRecipe
                  engineName={engineName(engineId)}
                  recipe={{
                    ...recipe,
                    image: resolved.image,
                    params: resolved.params,
                    resource: resolved.resource,
                    notes: resolved.notes,
                  }}
                  command={resolved.command}
                  precisions={precisions}
                  precision={precision}
                  onPrecisionChange={setPrecision}
                  computed={resolved.computed}
                />
              )}
```

(The resolved fields are spread onto the recipe so `RecipeCard` renders the variant's image/params/notes/resource; `StatusBadge`/`docUrl` come from the base recipe, which is correct.)

- [ ] **Step 5: Type-check + full test run**

Run: `cd web && pnpm type-check && pnpm test`
Expected: type-check passes; all test files PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/app/page.tsx && git commit -m "feat(ui): wire precision state into the wizard step 5"
```

---

### Task 8: Build verification + manual smoke

**Files:** none (verification only)

- [ ] **Step 1: Production build (static export)**

Run: `cd web && pnpm build`
Expected: build succeeds; no type errors; `docs/` (or configured `out`) regenerated without errors.

- [ ] **Step 2: Manual smoke in dev**

Run: `cd web && pnpm dev`
Then in a browser walk the wizard: scenario → a dense model (e.g. Qwen) → vLLM → a GPU → step 5. Confirm:
- A chip row shows FP16 / FP8 / AWQ / GPTQ.
- Clicking AWQ rewrites the command block to include `--quantization awq` and shows the "推导命令 · 非实测" tag.
- The GPU fit line on step 4 reflects the chosen precision after going back/forward (precision resets to FP16 when you change model/engine).
- An embedding model + TEI shows no chip row (fp16 only).
- Resize to mobile width: the chip row wraps, no overflow.

- [ ] **Step 3: Final full gate**

Run: `cd web && pnpm test && pnpm type-check && pnpm build`
Expected: all green.

---

## Self-Review

**Spec coverage:**
- §4 `Precision` centralized + `QuantVariant` + `EngineRecipe.variants` → Task 1. ✓
- §5 `QUANT_SUPPORT` engine capability table + invariants → Task 2 (+ completeness/fp16-first tests). ✓
- §6.3 command-builder per-engine quant flags (vllm/sglang `--quantization`, tgi `--quantize`, lmdeploy `--model-format awq --quant-policy 4`, llamacpp/embedding no-op, unknown unchanged, replace-not-duplicate) → Task 3. ✓
- §6.1 `availablePrecisions` (fp16-only for command-less; variant-without-command still offered) → Task 4. ✓
- §6.2 `resolveVariant` three branches (base / override-merge / computed with appended param + 非实测 note, base image kept) → Task 4. ✓
- §7 step-5 chip row, state lifted to page, reset on model/engine change, fit recomputed with precision, mobile wrap → Tasks 5–7 + Task 8 smoke. ✓
- §8 tests + acceptance (pnpm test/type-check/build green, mobile) → Tasks 1–8 gates. ✓

**Placeholder scan:** No TBD/TODO; every code step ships complete code; the only non-test step (Task 5 Step 1 CSS, Task 8 verification) is gated by build/manual checks. ✓

**Type consistency:**
- `Precision` defined in Task 1 (`recipes/types.ts`), imported identically in Tasks 2/3/4/5/6/7. ✓
- `BuildOpts` gains `quantization?: Precision` + `engineId?: EngineId` (Task 3); resolver calls `buildCommand(recipe, { tp, quantization, engineId })` (Task 4) with matching field names. ✓
- `resolveVariant(recipe, engineId, precision, { tp })` signature (Task 4) matches the page.tsx call site (Task 7 Step 3). ✓
- `ResolvedRecipe` fields (`command`/`image`/`params`/`resource`/`notes`/`computed`) — page spreads `image`/`params`/`resource`/`notes` onto recipe and passes `command`/`computed` separately (Task 7 Step 4), matching `RecipeCard` props (Task 5 Step 4). ✓
- `RecipeCard` props (`precisions`/`precision`/`onPrecisionChange`/`computed`) defined in Task 5 are passed identically by `StepRecipe` (Task 6) and `page.tsx` (Task 7). ✓
- `availablePrecisions(recipe, engineId)` returns `Precision[]`, consumed as `precisions` (Task 7). ✓
- `QUANT_SUPPORT` keyed by `EngineId`, read by `availablePrecisions` (Task 4) and the completeness test (Task 2). ✓
