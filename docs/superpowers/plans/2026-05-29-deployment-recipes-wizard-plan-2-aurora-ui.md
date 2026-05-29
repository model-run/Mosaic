# Deployment Recipes Wizard — Plan 2: Full-Screen Aurora UI + Recipe Card Polish (P2 + P3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the working scenario-first wizard (shipped plain in Plan 1) into the approved "deep-space aurora" full-bleed design, decompose the monolithic `page.tsx` into focused components, polish the step-5 recipe command card (param explanations / known-pitfall notes / status badges / docUrl / one-click copy / command syntax highlighting / graceful degradation for command-less recipes), and clear the four Plan 1 leftovers.

**Architecture:** Keep the pure-static Next.js 14 export. The wizard state machine stays in `app/page.tsx` (orchestrator holding `useState`), but every visual unit moves into `web/src/components/` — background, hero, step bar, shared option card + status badge, the five step bodies, and the recipe card + command block. The design system lives in two central places: Tailwind theme tokens (`tailwind.config.js`) and a set of `@layer components` classes in `globals.css` (aurora background, grain, glass card, gradient text/button, option-card states, command block). Three new **pure** logic modules — `lib/status.ts` (status → label/className), `lib/highlight.ts` (command tokenizer), `lib/engine-sort.ts` (status-ordered engine list, consuming the `getRecipe`/`getRecipeStatus` helpers) — are node-unit-tested; the presentational components are tested with React Testing Library under a jsdom environment.

**Tech Stack:** Next.js 14 (static export), React 18, TypeScript 5, Tailwind 3, pnpm 8. Tests via Vitest 2 — **adding** `@testing-library/react` + `@testing-library/jest-dom` + `jsdom` in Task 1 (logic tests stay in the `node` env; `*.test.tsx` runs in `jsdom`).

**High-fidelity visual reference:** `.superpowers/brainstorm/94869-1780030179/content/fullscreen-hero.html` (palette, hero, glass card, step bar, option-card hover/selected). **Design spec:** `docs/superpowers/specs/2026-05-29-mosaic-deployment-recipes-wizard-redesign-design.md` §5 (UI) + §6 (roadmap P2/P3).

**Palette (from spec §5):** violet `#7c3aed` · cyan `#22d3ee` · indigo `#4f46e5` · deep base `#070710`.

---

## File Structure

```
web/
├── vitest.config.ts                       # MODIFY (Task 1): jsdom for *.test.tsx, include tsx, setup, jsx automatic
├── package.json                           # MODIFY (Task 1): add RTL + jest-dom + jsdom
├── tailwind.config.js                     # MODIFY (Task 6): aurora tokens + fonts
├── .github/workflows/deploy.yml           # MODIFY (Task 15): bump action versions for Node 24
└── src/
    ├── test/setup.ts                       # NEW (Task 1): jest-dom matchers
    ├── lib/
    │   ├── fit-advisor.ts                  # MODIFY (Task 2): availableGB → totalAvailableGB
    │   ├── status.ts                       # NEW (Task 3): pure status → {label, className}
    │   ├── highlight.ts                     # NEW (Task 4): pure command tokenizer
    │   ├── engine-sort.ts                   # NEW (Task 5): pure status-ordered engines (uses getRecipe/getRecipeStatus)
    │   └── __tests__/                       # status / highlight / engine-sort node tests
    ├── app/
    │   ├── globals.css                      # REWRITE (Task 6): aurora design system
    │   └── page.tsx                         # REWRITE (Task 14): thin orchestrator over components
    └── components/                          # NEW — all created here
        ├── AuroraBackground.tsx             # Task 7
        ├── Hero.tsx                         # Task 8
        ├── StepBar.tsx                      # Task 9
        ├── StatusBadge.tsx                  # Task 10
        ├── OptionCard.tsx                   # Task 10
        ├── CommandBlock.tsx                 # Task 12
        ├── RecipeCard.tsx                   # Task 13
        ├── steps/StepScenario.tsx           # Task 11
        ├── steps/StepModel.tsx              # Task 11
        ├── steps/StepEngine.tsx             # Task 11
        ├── steps/StepGpu.tsx                # Task 11
        ├── steps/StepRecipe.tsx             # Task 13
        └── __tests__/                       # *.test.tsx (jsdom) component tests
```

**Plan 1 leftovers folded in:** `getRecipe`/`getRecipeStatus` enabled (Task 5, consumed in Task 11) · `availableGB`→`totalAvailableGB` (Task 2, before any new consumer) · vitest `include` extended to `*.test.tsx` + RTL (Task 1) · CI actions bumped for the GitHub-mandated Node 24 runtime (Task 15).

---

## Task 1: Add React Testing Library + jsdom; extend vitest to `*.test.tsx`

**Files:**
- Modify: `web/package.json`
- Modify: `web/vitest.config.ts`
- Create: `web/src/test/setup.ts`
- Create: `web/src/components/__tests__/smoke.test.tsx`

- [ ] **Step 1: Add the test dev deps**

Run (from `web/`):
```bash
cd /Users/fangyong/agent/Mosaic/web && pnpm add -D @testing-library/react@^16 @testing-library/jest-dom@^6 jsdom@^25
```
Expected: the three packages appear in `devDependencies`.

- [ ] **Step 2: Create the jest-dom setup file** at `web/src/test/setup.ts`

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Rewrite `web/vitest.config.ts`**

The logic suite stays in the fast `node` env; only `*.test.tsx` runs in `jsdom`. `esbuild.jsx: "automatic"` lets components render in tests without importing React.

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "node",
    environmentMatchGlobs: [["**/*.test.tsx", "jsdom"]],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

- [ ] **Step 4: Write a component smoke test** at `web/src/components/__tests__/smoke.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

function Hi() {
  return <p>hello aurora</p>;
}

describe("rtl + jsdom infra", () => {
  it("renders a component and matches jest-dom", () => {
    render(<Hi />);
    expect(screen.getByText("hello aurora")).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run the whole suite** (confirms the new tsx env coexists with the node logic tests)

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test`
Expected: all existing logic tests still pass **and** the new `smoke.test.tsx` passes (1 added).

- [ ] **Step 6: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/package.json web/pnpm-lock.yaml web/vitest.config.ts web/src/test/setup.ts web/src/components/__tests__/smoke.test.tsx && git commit -m "test: add react-testing-library + jsdom; run *.test.tsx in jsdom"
```

---

## Task 2: Rename `FitResult.availableGB` → `totalAvailableGB`

**Files:**
- Modify: `web/src/lib/fit-advisor.ts`
- Modify: `web/src/lib/__tests__/fit-advisor.test.ts`
- Modify: `web/src/app/page.tsx` (the only current consumer, line ~116)

Do this rename now, before the UI rewrite introduces new consumers (spec leftover: "加消费方前"). `totalAvailableGB` reads as "total across all cards" (`gpu.memory × count`), which is what the field is.

- [ ] **Step 1: Add the assertion that locks the new name** — in `web/src/lib/__tests__/fit-advisor.test.ts`, inside the first `it(...)` block, add this line after `expect(r.knownSize).toBe(true);`:

```ts
    expect(r.totalAvailableGB).toBe(80); // 80GB × 1 card
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/__tests__/fit-advisor.test.ts`
Expected: FAIL — `r.totalAvailableGB` is `undefined` (field still named `availableGB`).

- [ ] **Step 3: Rename in `web/src/lib/fit-advisor.ts`** — apply all three edits:

In the `FitResult` interface, change:
```ts
  availableGB: number;
```
to:
```ts
  totalAvailableGB: number;
```

In the no-size early return, change:
```ts
    return { knownSize: false, availableGB, recommendedTP: 1, suggestQuantization: false };
```
to:
```ts
    return { knownSize: false, totalAvailableGB: availableGB, recommendedTP: 1, suggestQuantization: false };
```

In the final return, change:
```ts
  return { knownSize: true, availableGB, requiredGB, fits, recommendedTP, suggestQuantization };
```
to:
```ts
  return { knownSize: true, totalAvailableGB: availableGB, requiredGB, fits, recommendedTP, suggestQuantization };
```

(The local `const availableGB = gpu.memory * cards;` stays — only the returned **field** is renamed.)

- [ ] **Step 4: Update the current consumer in `web/src/app/page.tsx`** — change:
```tsx
                  <div>需要约 {fit.requiredGB?.toFixed(0)} GB / 可用 {fit.availableGB} GB — {fit.fits ? "✅ 跑得动" : "⚠️ 显存不足"}</div>
```
to:
```tsx
                  <div>需要约 {fit.requiredGB?.toFixed(0)} GB / 可用 {fit.totalAvailableGB} GB — {fit.fits ? "✅ 跑得动" : "⚠️ 显存不足"}</div>
```

- [ ] **Step 5: Verify no stale references remain**

Run: `cd /Users/fangyong/agent/Mosaic/web && grep -rn "\.availableGB\|availableGB:" src && echo "FOUND" || echo "CLEAN"`
Expected: prints `CLEAN` (the only matches should be the renamed `totalAvailableGB`; the grep targets the old `.availableGB` member access and `availableGB:` object key — both gone). If anything prints before `CLEAN`/`FOUND`, fix that reference.

- [ ] **Step 6: Run test + type-check**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/__tests__/fit-advisor.test.ts && pnpm type-check`
Expected: test PASS; type-check no errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/lib/fit-advisor.ts web/src/lib/__tests__/fit-advisor.test.ts web/src/app/page.tsx && git commit -m "refactor(fit-advisor): rename FitResult.availableGB -> totalAvailableGB"
```

---

## Task 3: Pure status metadata (`lib/status.ts`)

**Files:**
- Create: `web/src/lib/status.ts`
- Test: `web/src/lib/__tests__/status.test.ts`

Single source of truth mapping a `RecipeStatus` to its zh-CN label and badge styling. Pure — consumed by `StatusBadge` (Task 10) and `RecipeCard` (Task 13).

- [ ] **Step 1: Write the failing test** at `web/src/lib/__tests__/status.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { statusMeta, STATUS_META } from "@/lib/status";

describe("status metadata", () => {
  it("labels all four statuses in zh-CN", () => {
    expect(statusMeta("native").label).toBe("原生支持");
    expect(statusMeta("partial").label).toBe("部分支持");
    expect(statusMeta("community").label).toBe("社区方案");
    expect(statusMeta("none").label).toBe("暂不支持");
  });

  it("every status carries a non-empty badge className", () => {
    for (const key of Object.keys(STATUS_META)) {
      expect(STATUS_META[key as keyof typeof STATUS_META].className.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/__tests__/status.test.ts`
Expected: FAIL — cannot find module `@/lib/status`.

- [ ] **Step 3: Create `web/src/lib/status.ts`**

```ts
import type { RecipeStatus } from "@/lib/recipes/types";

export interface StatusMeta {
  /** zh-CN badge label. */
  label: string;
  /** Tailwind classes: border + text + tinted background for the badge. */
  className: string;
}

export const STATUS_META: Record<RecipeStatus, StatusMeta> = {
  native: { label: "原生支持", className: "border-emerald-400/40 text-emerald-300 bg-emerald-400/10" },
  partial: { label: "部分支持", className: "border-amber-400/40 text-amber-300 bg-amber-400/10" },
  community: { label: "社区方案", className: "border-violet-400/40 text-violet-300 bg-violet-400/10" },
  none: { label: "暂不支持", className: "border-white/15 text-slate-400 bg-white/5" },
};

export function statusMeta(status: RecipeStatus): StatusMeta {
  return STATUS_META[status];
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/__tests__/status.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/lib/status.ts web/src/lib/__tests__/status.test.ts && git commit -m "feat: add pure recipe-status metadata map"
```

---

## Task 4: Pure command syntax highlighter (`lib/highlight.ts`)

**Files:**
- Create: `web/src/lib/highlight.ts`
- Test: `web/src/lib/__tests__/highlight.test.ts`

Tokenizes a shell command into classified segments so `CommandBlock` (Task 12) can color flags cyan and values amber (spec §5: "关键参数高亮(青/黄)"). Whitespace and newlines are preserved as `plain` segments so the caller renders inside `<pre>` without losing layout. Pure + deterministic — no library dependency.

- [ ] **Step 1: Write the failing test** at `web/src/lib/__tests__/highlight.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { highlight } from "@/lib/highlight";

describe("command highlighter", () => {
  it("classifies flags, numeric values, and image tags", () => {
    const segs = highlight("docker run --tensor-parallel-size 8 vllm/vllm-openai:v0.7.3");
    const find = (text: string) => segs.find((s) => s.text === text);

    expect(find("--tensor-parallel-size")?.kind).toBe("flag");
    expect(find("8")?.kind).toBe("value");
    expect(find("vllm/vllm-openai:v0.7.3")?.kind).toBe("value"); // contains ':'
    expect(find("docker")?.kind).toBe("plain");
  });

  it("marks the line-continuation backslash as 'cont'", () => {
    const segs = highlight("docker run \\\n  --gpus all");
    expect(segs.find((s) => s.text === "\\")?.kind).toBe("cont");
  });

  it("reconstructs the original command exactly (whitespace preserved)", () => {
    const cmd = "python -m sglang.launch_server --tp 4\n  --host 0.0.0.0";
    expect(highlight(cmd).map((s) => s.text).join("")).toBe(cmd);
  });

  it("handles single-dash short flags", () => {
    expect(highlight("-m vllm").find((s) => s.text === "-m")?.kind).toBe("flag");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/__tests__/highlight.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/src/lib/highlight.ts`**

```ts
export type SegmentKind = "flag" | "value" | "cont" | "plain";

export interface Segment {
  text: string;
  kind: SegmentKind;
}

// A flag: one or two leading dashes then a letter, then word chars / dashes.
const FLAG = /^--?[A-Za-z][\w-]*$/;
// A value: a pure number (incl. decimals) OR a token containing ':' (image:tag, host:port).
const VALUE = /^[\d.]+$|:/;

/**
 * Tokenize a shell command into classified segments for syntax highlighting.
 * Splits on whitespace runs but KEEPS them (as `plain`) so joining all segment
 * `text` reproduces the input exactly. Pure + deterministic (no Date/random).
 */
export function highlight(command: string): Segment[] {
  return command
    .split(/(\s+)/)
    .filter((t) => t.length > 0)
    .map((tok): Segment => {
      if (/^\s+$/.test(tok)) return { text: tok, kind: "plain" };
      if (tok === "\\") return { text: tok, kind: "cont" };
      if (FLAG.test(tok)) return { text: tok, kind: "flag" };
      if (VALUE.test(tok)) return { text: tok, kind: "value" };
      return { text: tok, kind: "plain" };
    });
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/__tests__/highlight.test.ts`
Expected: PASS (all four cases).

- [ ] **Step 5: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/lib/highlight.ts web/src/lib/__tests__/highlight.test.ts && git commit -m "feat: add pure shell-command syntax highlighter"
```

---

## Task 5: Status-ordered engine list (`lib/engine-sort.ts`) — enables `getRecipe`/`getRecipeStatus`

**Files:**
- Create: `web/src/lib/engine-sort.ts`
- Test: `web/src/lib/__tests__/engine-sort.test.ts`

Spec leftover: "启用 `getRecipe` / `getRecipeStatus`(用于引擎按 status 过滤/排序)". This pure module is the consumer: it drops engines with no recipe and sorts the rest native → partial → community. Used by `StepEngine` (Task 11).

- [ ] **Step 1: Write the failing test** at `web/src/lib/__tests__/engine-sort.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { enginesForModel } from "@/lib/engine-sort";
import { MODELS } from "@/lib/recipes/data";
import type { ModelEntry } from "@/lib/recipes/types";

const fake: ModelEntry = {
  id: "fake",
  name: "Fake",
  category: "dense",
  meta: "test",
  engines: {
    lmdeploy: { status: "community", command: "x" },
    vllm: { status: "native", command: "x" },
    sglang: { status: "partial", command: "x" },
  },
};

describe("enginesForModel", () => {
  it("orders engines native → partial → community", () => {
    expect(enginesForModel(fake)).toEqual(["vllm", "sglang", "lmdeploy"]);
  });

  it("returns only engines that actually have a recipe", () => {
    const real = MODELS[0];
    const ids = enginesForModel(real);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => real.engines[id] !== undefined)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/__tests__/engine-sort.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/src/lib/engine-sort.ts`**

```ts
import type { EngineId, ModelEntry, RecipeStatus } from "@/lib/recipes/types";
import { getRecipe, getRecipeStatus } from "@/lib/recipes/data";

// Display rank: native first, then partial, then community.
// "none" sorts last but never appears — absent engines are filtered out below.
const STATUS_RANK: Record<RecipeStatus, number> = {
  native: 0,
  partial: 1,
  community: 2,
  none: 3,
};

/**
 * Engine ids that have a recipe for this model, sorted by support status
 * (native → partial → community). Engines with no recipe are dropped.
 */
export function enginesForModel(model: ModelEntry): EngineId[] {
  return (Object.keys(model.engines) as EngineId[])
    .filter((id) => getRecipe(model, id) !== undefined)
    .sort(
      (a, b) => STATUS_RANK[getRecipeStatus(model, a)] - STATUS_RANK[getRecipeStatus(model, b)],
    );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/lib/__tests__/engine-sort.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/lib/engine-sort.ts web/src/lib/__tests__/engine-sort.test.ts && git commit -m "feat: status-ordered engine list (enables getRecipe/getRecipeStatus)"
```

---

## Task 6: Aurora design system (`globals.css` + `tailwind.config.js`)

**Files:**
- Rewrite: `web/src/app/globals.css`
- Modify: `web/tailwind.config.js`

This is the centralized design system (spec §5: "设计系统集中在一处"). No unit test (pure CSS); the gate is `pnpm build` succeeding in Task 14 and the visual pass. Classes here are consumed by every component in Tasks 7–14.

- [ ] **Step 1: Replace `web/src/app/globals.css` entirely** with the aurora system (ported from the high-fidelity preview):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --aurora-violet: 124 58 237; /* #7c3aed */
  --aurora-cyan: 34 211 238; /* #22d3ee */
  --aurora-indigo: 79 70 229; /* #4f46e5 */
  --bg-deep: 7 7 16; /* #070710 */
}

html,
body {
  background: rgb(var(--bg-deep));
  color: #e8eaf2;
  -webkit-font-smoothing: antialiased;
}

body {
  overflow-x: hidden;
}

@layer components {
  /* Full-viewport multi-focal aurora + fine grain (fixed, behind content). */
  .aurora-bg {
    @apply fixed inset-0 -z-10;
    background:
      radial-gradient(60% 50% at 18% 8%, rgba(124, 58, 237, 0.4), transparent 60%),
      radial-gradient(55% 45% at 88% 12%, rgba(34, 211, 238, 0.28), transparent 58%),
      radial-gradient(70% 60% at 60% 100%, rgba(79, 70, 229, 0.3), transparent 60%),
      rgb(var(--bg-deep));
    filter: saturate(1.1);
  }
  .grain {
    @apply pointer-events-none fixed inset-0 -z-10;
    opacity: 0.5;
    background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: 3px 3px;
  }

  /* Hero */
  .hero {
    @apply flex min-h-[60vh] flex-col items-center justify-center px-6 pb-3 pt-12 text-center;
  }
  .pill {
    @apply mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs;
    color: #c4b5fd;
    background: rgba(124, 58, 237, 0.14);
    border-color: rgba(124, 58, 237, 0.4);
  }
  .pill .dot {
    @apply h-1.5 w-1.5 rounded-full;
    background: #22d3ee;
    box-shadow: 0 0 10px #22d3ee;
  }
  .gradient-text {
    @apply text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl;
    background: linear-gradient(92deg, #ffffff 10%, #c7b8ff 50%, #7ee7ff);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .hero-sub {
    @apply mt-5 max-w-[52ch] text-base leading-relaxed text-slate-400 md:text-lg;
  }

  /* Wizard glass card */
  .wizard-stage {
    @apply mx-auto mb-20 max-w-5xl px-4;
  }
  .glass {
    @apply overflow-hidden rounded-3xl border;
    background: rgba(255, 255, 255, 0.045);
    border-color: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    box-shadow: 0 40px 120px -40px rgba(80, 40, 200, 0.5);
  }
  .glass-body {
    @apply px-6 py-8 md:px-8;
  }

  /* Step bar */
  .step-bar {
    @apply flex flex-wrap gap-1 border-b px-6 py-4 text-[13px] text-slate-500;
    border-color: rgba(255, 255, 255, 0.07);
  }
  .step-bar .active {
    @apply font-semibold text-indigo-300;
  }
  .step-bar .done {
    @apply text-slate-300;
  }
  .step-bar .sep {
    @apply text-slate-700;
  }
  .step-label {
    @apply mb-2 text-xs uppercase tracking-[0.12em] text-slate-500;
  }
  .step-q {
    @apply mb-6 text-xl font-semibold text-slate-100 md:text-2xl;
  }

  /* Card grid + option card (hover lift/glow, selected cyan ring) */
  .card-grid {
    @apply grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3;
  }
  .option-card {
    @apply block w-full cursor-pointer rounded-2xl border p-5 text-left transition-all duration-200;
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.09);
  }
  .option-card:hover {
    @apply -translate-y-0.5;
    border-color: rgba(124, 58, 237, 0.55);
    background: rgba(124, 58, 237, 0.1);
    box-shadow: 0 18px 50px -24px rgba(124, 58, 237, 0.7);
  }
  .option-card.is-selected {
    border-color: #22d3ee;
    background: rgba(34, 211, 238, 0.1);
    box-shadow:
      0 0 0 1px #22d3ee,
      0 18px 50px -22px rgba(34, 211, 238, 0.6);
  }
  .option-ico {
    @apply mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl text-xl;
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.5), rgba(34, 211, 238, 0.4));
  }

  /* GPU fit panel */
  .fit-panel {
    @apply mt-5 rounded-2xl p-4 text-sm text-slate-200;
    background: rgba(255, 255, 255, 0.04);
  }

  /* Gradient CTA */
  .gradient-btn {
    @apply rounded-xl px-6 py-3 text-[15px] font-semibold transition-shadow;
    color: #0a0a14;
    background: linear-gradient(135deg, #a5b4fc, #67e8f9);
    box-shadow: 0 12px 36px -10px rgba(103, 232, 249, 0.7);
  }

  /* Command block (dark code + copy button) */
  .cmd-block {
    @apply relative overflow-hidden rounded-2xl border border-white/10 bg-black/60;
  }
  .cmd-pre {
    @apply overflow-x-auto whitespace-pre p-4 pr-24 font-mono text-[13px] leading-relaxed;
  }
  .cmd-copy {
    @apply absolute right-3 top-3 rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200 transition-colors hover:bg-white/10;
  }

  /* Recipe extras */
  .param-list {
    @apply space-y-1.5 text-sm;
  }
  .degraded-note {
    @apply rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200/90;
  }
}
```

- [ ] **Step 2: Update `web/tailwind.config.js`** — register the aurora palette and font tokens (keep `content` as-is; it already covers `components`/`app`). Replace the `theme.extend` block's `colors` and `fontFamily` so the file's `extend` reads:

```js
    extend: {
      colors: {
        aurora: {
          violet: '#7c3aed',
          cyan: '#22d3ee',
          indigo: '#4f46e5',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'PingFang SC', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
```

(The old `secondary` palette is dropped — nothing references it after the `globals.css` rewrite. `primary` is kept as a harmless safety net.)

- [ ] **Step 3: Verify Tailwind compiles the new layer** (build is the real gate; do a quick dev compile check)

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm build`
Expected: build succeeds, `out/` produced. (The page still renders the Plan 1 markup — that's fine; the new classes aren't used until Task 14, but they must compile without `@apply` errors. If `@apply` errors on an unknown utility, fix the offending class here.)

- [ ] **Step 4: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/app/globals.css web/tailwind.config.js && git commit -m "feat(ui): centralize deep-space aurora design system"
```

---

## Task 7: `AuroraBackground` component

**Files:**
- Create: `web/src/components/AuroraBackground.tsx`
- Test: `web/src/components/__tests__/AuroraBackground.test.tsx`

- [ ] **Step 1: Write the failing test** at `web/src/components/__tests__/AuroraBackground.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AuroraBackground } from "@/components/AuroraBackground";

describe("AuroraBackground", () => {
  it("renders the aurora and grain layers", () => {
    const { container } = render(<AuroraBackground />);
    expect(container.querySelector(".aurora-bg")).toBeInTheDocument();
    expect(container.querySelector(".grain")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/components/__tests__/AuroraBackground.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/src/components/AuroraBackground.tsx`**

```tsx
export function AuroraBackground() {
  return (
    <>
      <div className="aurora-bg" aria-hidden />
      <div className="grain" aria-hidden />
    </>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/components/__tests__/AuroraBackground.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/components/AuroraBackground.tsx web/src/components/__tests__/AuroraBackground.test.tsx && git commit -m "feat(ui): aurora background component"
```

---

## Task 8: `Hero` component (capability pill with live counts)

**Files:**
- Create: `web/src/components/Hero.tsx`
- Test: `web/src/components/__tests__/Hero.test.tsx`

The capability pill shows the real model + engine counts (spec §5: "能力胶囊(覆盖模型/引擎数)"), derived from the data so it never goes stale.

- [ ] **Step 1: Write the failing test** at `web/src/components/__tests__/Hero.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Hero } from "@/components/Hero";
import { ENGINES } from "@/lib/recipes/engines";
import { MODELS } from "@/lib/recipes/data";

describe("Hero", () => {
  it("renders the gradient headline", () => {
    const { container } = render(<Hero />);
    expect(container.querySelector(".gradient-text")?.textContent).toContain("可跑的部署命令");
  });

  it("shows live model and engine counts in the capability pill", () => {
    const { container } = render(<Hero />);
    const text = container.textContent ?? "";
    expect(text).toContain(`${MODELS.length}`);
    expect(text).toContain(`${ENGINES.length} 大推理引擎`);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/components/__tests__/Hero.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/src/components/Hero.tsx`**

```tsx
import { ENGINES } from "@/lib/recipes/engines";
import { MODELS } from "@/lib/recipes/data";

export function Hero() {
  return (
    <section className="hero">
      <div className="pill">
        <span className="dot" />
        覆盖 {MODELS.length}+ 模型 · {ENGINES.length} 大推理引擎
      </div>
      <h1 className="gradient-text">
        三分钟生成
        <br />
        可跑的部署命令
      </h1>
      <p className="hero-sub">
        从你的场景出发，自动推荐模型与引擎，产出经过实测、复制即可运行的部署配方。
      </p>
    </section>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/components/__tests__/Hero.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/components/Hero.tsx web/src/components/__tests__/Hero.test.tsx && git commit -m "feat(ui): full-screen hero with live capability counts"
```

---

## Task 9: `StepBar` component

**Files:**
- Create: `web/src/components/StepBar.tsx`
- Test: `web/src/components/__tests__/StepBar.test.tsx`

Renders the five-step indicator; the current step is `active`, earlier steps are `done`. Exports the `STEPS` label array so `page.tsx` shares one source of step names.

- [ ] **Step 1: Write the failing test** at `web/src/components/__tests__/StepBar.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StepBar, STEPS } from "@/components/StepBar";

describe("StepBar", () => {
  it("defines the five wizard steps", () => {
    expect(STEPS).toEqual(["场景", "模型", "引擎", "GPU 校验", "配方命令"]);
  });

  it("marks the current step active and earlier steps done", () => {
    const { container } = render(<StepBar current={1} />);
    expect(container.querySelector(".active")?.textContent).toContain("模型");
    expect(container.querySelector(".done")?.textContent).toContain("场景");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/components/__tests__/StepBar.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/src/components/StepBar.tsx`**

```tsx
export const STEPS = ["场景", "模型", "引擎", "GPU 校验", "配方命令"];

const NUMERALS = ["①", "②", "③", "④", "⑤"];

export function StepBar({ current }: { current: number }) {
  return (
    <ol className="step-bar">
      {STEPS.map((label, i) => (
        <li key={label} className={i === current ? "active" : i < current ? "done" : ""}>
          {NUMERALS[i]} {label}
          {i < STEPS.length - 1 && <span className="sep"> › </span>}
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/components/__tests__/StepBar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/components/StepBar.tsx web/src/components/__tests__/StepBar.test.tsx && git commit -m "feat(ui): wizard step bar"
```

---

## Task 10: Shared primitives — `StatusBadge` + `OptionCard`

**Files:**
- Create: `web/src/components/StatusBadge.tsx`
- Create: `web/src/components/OptionCard.tsx`
- Test: `web/src/components/__tests__/StatusBadge.test.tsx`
- Test: `web/src/components/__tests__/OptionCard.test.tsx`

`StatusBadge` renders the `lib/status.ts` mapping (Task 3). `OptionCard` is the reusable clickable card (icon / title / desc / optional badge / selected glow) used by all four selection steps.

- [ ] **Step 1: Write the failing tests**

`web/src/components/__tests__/StatusBadge.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/StatusBadge";

describe("StatusBadge", () => {
  it("renders the zh-CN label for a status", () => {
    render(<StatusBadge status="native" />);
    expect(screen.getByText("原生支持")).toBeInTheDocument();
  });
});
```

`web/src/components/__tests__/OptionCard.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OptionCard } from "@/components/OptionCard";

describe("OptionCard", () => {
  it("renders title + desc and fires onClick", () => {
    const onClick = vi.fn();
    render(<OptionCard title="vLLM" desc="UC Berkeley" onClick={onClick} />);
    expect(screen.getByText("vLLM")).toBeInTheDocument();
    expect(screen.getByText("UC Berkeley")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("adds the is-selected class when selected", () => {
    render(<OptionCard title="vLLM" selected onClick={() => {}} />);
    expect(screen.getByRole("button").className).toContain("is-selected");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/components/__tests__/StatusBadge.test.tsx src/components/__tests__/OptionCard.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create `web/src/components/StatusBadge.tsx`**

```tsx
import type { RecipeStatus } from "@/lib/recipes/types";
import { statusMeta } from "@/lib/status";

export function StatusBadge({ status }: { status: RecipeStatus }) {
  const { label, className } = statusMeta(status);
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
```

- [ ] **Step 4: Create `web/src/components/OptionCard.tsx`**

```tsx
import type { ReactNode } from "react";

interface OptionCardProps {
  title: string;
  icon?: ReactNode;
  desc?: ReactNode;
  badge?: ReactNode;
  selected?: boolean;
  onClick: () => void;
}

export function OptionCard({ title, icon, desc, badge, selected, onClick }: OptionCardProps) {
  return (
    <button type="button" onClick={onClick} className={`option-card ${selected ? "is-selected" : ""}`}>
      {icon && <div className="option-ico">{icon}</div>}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
        {badge}
      </div>
      {desc && <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{desc}</p>}
    </button>
  );
}
```

- [ ] **Step 5: Run them to verify they pass**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/components/__tests__/StatusBadge.test.tsx src/components/__tests__/OptionCard.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/components/StatusBadge.tsx web/src/components/OptionCard.tsx web/src/components/__tests__/StatusBadge.test.tsx web/src/components/__tests__/OptionCard.test.tsx && git commit -m "feat(ui): StatusBadge + reusable OptionCard primitives"
```

---

## Task 11: Step bodies — `StepScenario` / `StepModel` / `StepEngine` / `StepGpu`

**Files:**
- Create: `web/src/components/steps/StepScenario.tsx`
- Create: `web/src/components/steps/StepModel.tsx`
- Create: `web/src/components/steps/StepEngine.tsx`
- Create: `web/src/components/steps/StepGpu.tsx`
- Test: `web/src/components/__tests__/StepEngine.test.tsx`
- Test: `web/src/components/__tests__/StepScenario.test.tsx`

`StepEngine` consumes `enginesForModel` (Task 5) + `StatusBadge`, so its test also proves the status-ordering wiring end-to-end. `StepGpu` reads `fit.totalAvailableGB` (Task 2).

- [ ] **Step 1: Write the failing tests**

`web/src/components/__tests__/StepScenario.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepScenario } from "@/components/steps/StepScenario";

describe("StepScenario", () => {
  it("renders all six scenarios and reports the picked id", () => {
    const onSelect = vi.fn();
    render(<StepScenario selected={null} onSelect={onSelect} />);
    expect(screen.getAllByRole("button")).toHaveLength(6);
    fireEvent.click(screen.getByText("对话 / 助手"));
    expect(onSelect).toHaveBeenCalledWith("chat");
  });
});
```

`web/src/components/__tests__/StepEngine.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepEngine } from "@/components/steps/StepEngine";
import type { ModelEntry } from "@/lib/recipes/types";

const model: ModelEntry = {
  id: "m",
  name: "M",
  category: "dense",
  meta: "x",
  engines: {
    lmdeploy: { status: "community", command: "x" },
    vllm: { status: "native", command: "x" },
  },
};

describe("StepEngine", () => {
  it("lists engines status-ordered (native first) with a badge, and reports the pick", () => {
    const onSelect = vi.fn();
    render(<StepEngine model={model} selected={null} onSelect={onSelect} />);

    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(["vLLM", "LMDeploy"]); // native before community

    expect(screen.getByText("原生支持")).toBeInTheDocument();
    expect(screen.getByText("社区方案")).toBeInTheDocument();

    fireEvent.click(screen.getByText("vLLM"));
    expect(onSelect).toHaveBeenCalledWith("vllm");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/components/__tests__/StepScenario.test.tsx src/components/__tests__/StepEngine.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create `web/src/components/steps/StepScenario.tsx`**

```tsx
import { SCENARIOS, type ScenarioId } from "@/lib/recipes/scenarios";
import { OptionCard } from "@/components/OptionCard";

export function StepScenario({
  selected,
  onSelect,
}: {
  selected: ScenarioId | null;
  onSelect: (id: ScenarioId) => void;
}) {
  return (
    <div>
      <div className="step-label">STEP 01</div>
      <h2 className="step-q">你想用模型来做什么？</h2>
      <div className="card-grid">
        {SCENARIOS.map((s) => (
          <OptionCard
            key={s.id}
            icon={s.icon}
            title={s.label}
            desc={s.desc}
            selected={selected === s.id}
            onClick={() => onSelect(s.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `web/src/components/steps/StepModel.tsx`**

```tsx
import type { ModelEntry } from "@/lib/recipes/types";
import { OptionCard } from "@/components/OptionCard";

export function StepModel({
  models,
  selected,
  onSelect,
}: {
  models: ModelEntry[];
  selected: ModelEntry | null;
  onSelect: (m: ModelEntry) => void;
}) {
  return (
    <div>
      <div className="step-label">STEP 02</div>
      <h2 className="step-q">选择模型</h2>
      <div className="card-grid">
        {models.map((m) => (
          <OptionCard
            key={m.id}
            title={m.name}
            desc={m.meta}
            selected={selected?.id === m.id}
            onClick={() => onSelect(m)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `web/src/components/steps/StepEngine.tsx`**

```tsx
import type { ModelEntry, EngineId } from "@/lib/recipes/types";
import { ENGINES } from "@/lib/recipes/engines";
import { getRecipeStatus } from "@/lib/recipes/data";
import { enginesForModel } from "@/lib/engine-sort";
import { OptionCard } from "@/components/OptionCard";
import { StatusBadge } from "@/components/StatusBadge";

const engineName = (id: EngineId) => ENGINES.find((e) => e.id === id)?.name ?? id;

export function StepEngine({
  model,
  selected,
  onSelect,
}: {
  model: ModelEntry;
  selected: EngineId | null;
  onSelect: (id: EngineId) => void;
}) {
  const ids = enginesForModel(model);
  return (
    <div>
      <div className="step-label">STEP 03</div>
      <h2 className="step-q">选择推理引擎</h2>
      <div className="card-grid">
        {ids.map((id) => (
          <OptionCard
            key={id}
            title={engineName(id)}
            badge={<StatusBadge status={getRecipeStatus(model, id)} />}
            selected={selected === id}
            onClick={() => onSelect(id)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create `web/src/components/steps/StepGpu.tsx`**

```tsx
import type { GPUInfo } from "@/types";
import type { FitResult } from "@/lib/fit-advisor";
import { gpuData } from "@/lib/gpu-data";
import { OptionCard } from "@/components/OptionCard";

export function StepGpu({
  gpu,
  count,
  fit,
  onSelectGpu,
  onCountChange,
  onNext,
}: {
  gpu: GPUInfo | null;
  count: number;
  fit: FitResult | null;
  onSelectGpu: (g: GPUInfo) => void;
  onCountChange: (n: number) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="step-label">STEP 04</div>
      <h2 className="step-q">校验显存是否够用</h2>
      <div className="card-grid">
        {gpuData.map((g) => (
          <OptionCard
            key={g.id}
            title={g.name}
            desc={`${g.memory} GB · ${g.tier}`}
            selected={gpu?.id === g.id}
            onClick={() => onSelectGpu(g)}
          />
        ))}
      </div>

      <label className="mt-5 flex items-center gap-3 text-sm text-slate-300">
        卡数
        <input
          type="number"
          min={1}
          value={count}
          onChange={(e) => onCountChange(Math.max(1, Number(e.target.value)))}
          className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-100"
        />
      </label>

      {fit && (
        <div className="fit-panel">
          {fit.knownSize ? (
            <>
              <div>
                需要约 {fit.requiredGB?.toFixed(0)} GB / 可用 {fit.totalAvailableGB} GB —{" "}
                {fit.fits ? "✅ 跑得动" : "⚠️ 显存不足"}
              </div>
              <div className="mt-1 text-slate-400">推荐 tensor-parallel-size：{fit.recommendedTP}</div>
              {fit.suggestQuantization && (
                <div className="mt-1 text-amber-300">建议使用量化（AWQ/FP8）以放入当前显存</div>
              )}
            </>
          ) : (
            <div>该模型暂无显存估算，请参考下一步配方中的资源建议。</div>
          )}
        </div>
      )}

      <button type="button" disabled={!gpu} onClick={onNext} className="gradient-btn mt-6 disabled:opacity-40">
        查看配方 →
      </button>
    </div>
  );
}
```

- [ ] **Step 7: Run the step tests to verify they pass**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/components/__tests__/StepScenario.test.tsx src/components/__tests__/StepEngine.test.tsx`
Expected: PASS (both, including the native-before-community ordering).

- [ ] **Step 8: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/components/steps/StepScenario.tsx web/src/components/steps/StepModel.tsx web/src/components/steps/StepEngine.tsx web/src/components/steps/StepGpu.tsx web/src/components/__tests__/StepScenario.test.tsx web/src/components/__tests__/StepEngine.test.tsx && git commit -m "feat(ui): scenario/model/engine/gpu step bodies"
```

---

## Task 12: `CommandBlock` — highlighted command + one-click copy

**Files:**
- Create: `web/src/components/CommandBlock.tsx`
- Test: `web/src/components/__tests__/CommandBlock.test.tsx`

Renders the highlighted command (Task 4 segments) in a dark `<pre>` with a copy button that writes to the clipboard and flips to a "已复制 ✓" confirmation (spec §5: "渐变复制按钮(复制后短暂反馈)").

- [ ] **Step 1: Write the failing test** at `web/src/components/__tests__/CommandBlock.test.tsx`

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommandBlock } from "@/components/CommandBlock";

const CMD = "docker run --tensor-parallel-size 8 vllm/vllm-openai:v0.7.3";

describe("CommandBlock", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders the command text", () => {
    const { container } = render(<CommandBlock command={CMD} />);
    expect(container.querySelector(".cmd-pre")?.textContent).toBe(CMD);
  });

  it("highlights flags with the cyan class", () => {
    const { container } = render(<CommandBlock command={CMD} />);
    const flag = Array.from(container.querySelectorAll("span")).find(
      (s) => s.textContent === "--tensor-parallel-size",
    );
    expect(flag?.className).toContain("text-cyan-300");
  });

  it("copies to clipboard and shows feedback on click", async () => {
    render(<CommandBlock command={CMD} />);
    fireEvent.click(screen.getByText("复制"));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(CMD);
    expect(await screen.findByText("已复制 ✓")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/components/__tests__/CommandBlock.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/src/components/CommandBlock.tsx`**

```tsx
"use client";

import { useState } from "react";
import { highlight, type SegmentKind } from "@/lib/highlight";

const KIND_CLASS: Record<SegmentKind, string> = {
  flag: "text-cyan-300",
  value: "text-amber-300",
  cont: "text-slate-600",
  plain: "text-slate-200",
};

export function CommandBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable (e.g. insecure context) — no-op */
    }
  };

  return (
    <div className="cmd-block">
      <button type="button" onClick={copy} className="cmd-copy">
        {copied ? "已复制 ✓" : "复制"}
      </button>
      <pre className="cmd-pre">
        {highlight(command).map((seg, i) => (
          <span key={i} className={KIND_CLASS[seg.kind]}>
            {seg.text}
          </span>
        ))}
      </pre>
    </div>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/components/__tests__/CommandBlock.test.tsx`
Expected: PASS (text, highlight class, copy + feedback).

- [ ] **Step 5: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/components/CommandBlock.tsx web/src/components/__tests__/CommandBlock.test.tsx && git commit -m "feat(ui): CommandBlock with syntax highlight + copy feedback"
```

---

## Task 13: `RecipeCard` + `StepRecipe` — full render & graceful degradation

**Files:**
- Create: `web/src/components/RecipeCard.tsx`
- Create: `web/src/components/steps/StepRecipe.tsx`
- Test: `web/src/components/__tests__/RecipeCard.test.tsx`

`RecipeCard` is the P3 payload: status badge + image + command block (or degraded note when there's no command) + per-param explanations + resource + known-pitfall notes + docUrl. `StepRecipe` is the thin step-5 wrapper.

- [ ] **Step 1: Write the failing test** at `web/src/components/__tests__/RecipeCard.test.tsx`

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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
    expect(screen.getByText("复制")).toBeInTheDocument(); // CommandBlock present
    expect(screen.getByText("张量并行度")).toBeInTheDocument();
    expect(screen.getByText(/已知坑/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /官方文档/ })).toHaveAttribute("href", "https://docs.vllm.ai");
  });

  it("degrades when there is no command: shows a note, no copy button", () => {
    render(<RecipeCard engineName="TensorRT-LLM" recipe={noCommand} command={null} />);
    expect(screen.queryByText("复制")).not.toBeInTheDocument();
    expect(screen.getByText(/暂无一键命令/)).toBeInTheDocument();
    expect(screen.getByText(/预编译/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/components/__tests__/RecipeCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/src/components/RecipeCard.tsx`**

```tsx
import type { EngineRecipe } from "@/lib/recipes/types";
import { CommandBlock } from "@/components/CommandBlock";
import { StatusBadge } from "@/components/StatusBadge";

export function RecipeCard({
  engineName,
  recipe,
  command,
}: {
  engineName: string;
  recipe: EngineRecipe;
  command: string | null;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold text-slate-100">{engineName}</h3>
        <StatusBadge status={recipe.status} />
        {recipe.image && <code className="text-xs text-slate-400">{recipe.image}</code>}
      </div>

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
              <span className="text-slate-400"> — {p.desc}</span>
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

(Note: the `notes` line is only shown separately when there **is** a command — for the degraded path the note is already folded into the degraded box, so it isn't repeated.)

- [ ] **Step 4: Create `web/src/components/steps/StepRecipe.tsx`**

```tsx
import type { EngineRecipe } from "@/lib/recipes/types";
import { RecipeCard } from "@/components/RecipeCard";

export function StepRecipe({
  engineName,
  recipe,
  command,
}: {
  engineName: string;
  recipe: EngineRecipe;
  command: string | null;
}) {
  return (
    <div>
      <div className="step-label">STEP 05</div>
      <h2 className="step-q">复制即可运行的配方</h2>
      <RecipeCard engineName={engineName} recipe={recipe} command={command} />
    </div>
  );
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test src/components/__tests__/RecipeCard.test.tsx`
Expected: PASS (both full and degraded branches).

- [ ] **Step 6: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/components/RecipeCard.tsx web/src/components/steps/StepRecipe.tsx web/src/components/__tests__/RecipeCard.test.tsx && git commit -m "feat(ui): RecipeCard (params/notes/status/docUrl) + StepRecipe + degradation"
```

---

## Task 14: Assemble `page.tsx` orchestrator + full verification

**Files:**
- Rewrite: `web/src/app/page.tsx`

The page becomes a thin orchestrator: holds the wizard state, composes `AuroraBackground` + `Hero` + the glass card (`StepBar` + active step body + back button). All visuals now live in components.

- [ ] **Step 1: Rewrite `web/src/app/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { GPUInfo } from "@/types";
import type { ModelEntry, EngineId, EngineRecipe } from "@/lib/recipes/types";
import { ENGINES } from "@/lib/recipes/engines";
import { getModelsForScenario, type ScenarioId } from "@/lib/recipes/scenarios";
import { advise } from "@/lib/fit-advisor";
import { buildCommand } from "@/lib/command-builder";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Hero } from "@/components/Hero";
import { StepBar } from "@/components/StepBar";
import { StepScenario } from "@/components/steps/StepScenario";
import { StepModel } from "@/components/steps/StepModel";
import { StepEngine } from "@/components/steps/StepEngine";
import { StepGpu } from "@/components/steps/StepGpu";
import { StepRecipe } from "@/components/steps/StepRecipe";

export default function Home() {
  const [step, setStep] = useState(0);
  const [scenario, setScenario] = useState<ScenarioId | null>(null);
  const [model, setModel] = useState<ModelEntry | null>(null);
  const [engineId, setEngineId] = useState<EngineId | null>(null);
  const [gpu, setGpu] = useState<GPUInfo | null>(null);
  const [count, setCount] = useState(1);

  const models = scenario ? getModelsForScenario(scenario) : [];
  const recipe: EngineRecipe | undefined = model && engineId ? model.engines[engineId] : undefined;
  const fit = model && gpu ? advise(model.id, gpu, count) : null;
  const command = recipe ? buildCommand(recipe, fit ? { tp: fit.recommendedTP } : {}) : null;
  const engineName = (id: EngineId) => ENGINES.find((e) => e.id === id)?.name ?? id;

  return (
    <main className="relative min-h-screen text-slate-100">
      <AuroraBackground />
      <div className="relative z-10">
        <Hero />
        <div className="wizard-stage">
          <div className="glass">
            <StepBar current={step} />
            <div className="glass-body">
              {step === 0 && (
                <StepScenario
                  selected={scenario}
                  onSelect={(id) => {
                    setScenario(id);
                    setModel(null);
                    setEngineId(null);
                    setStep(1);
                  }}
                />
              )}
              {step === 1 && (
                <StepModel
                  models={models}
                  selected={model}
                  onSelect={(m) => {
                    setModel(m);
                    setEngineId(null);
                    setStep(2);
                  }}
                />
              )}
              {step === 2 && model && (
                <StepEngine
                  model={model}
                  selected={engineId}
                  onSelect={(id) => {
                    setEngineId(id);
                    setStep(3);
                  }}
                />
              )}
              {step === 3 && (
                <StepGpu
                  gpu={gpu}
                  count={count}
                  fit={fit}
                  onSelectGpu={setGpu}
                  onCountChange={setCount}
                  onNext={() => setStep(4)}
                />
              )}
              {step === 4 && recipe && engineId && (
                <StepRecipe engineName={engineName(engineId)} recipe={recipe} command={command} />
              )}

              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="mt-8 text-sm text-slate-400 transition-colors hover:text-slate-200"
                >
                  ← 上一步
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm type-check`
Expected: no errors.

- [ ] **Step 3: Run the full test suite**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm test`
Expected: all logic + component tests pass.

- [ ] **Step 4: Build the static export**

Run: `cd /Users/fangyong/agent/Mosaic/web && pnpm build`
Expected: build completes, `out/` produced, no errors.

- [ ] **Step 5: Visual + responsive verification with the dev server**

Start the server: `cd /Users/fangyong/agent/Mosaic/web && pnpm dev` (background it).
Then use the Playwright MCP tools to verify against the reference preview `.superpowers/brainstorm/94869-1780030179/content/fullscreen-hero.html`:
- Navigate to `http://localhost:3000`.
- **Desktop (1280×800):** resize, screenshot. Confirm: aurora gradient background + grain, gradient headline, capability pill with counts, glass wizard card, step bar, 6 scenario cards in a 3-column grid; hovering a card lifts/glows; clicking one advances and highlights with a cyan ring.
- Walk the five steps: scenario → model (cards) → engine (status badges, native first) → GPU (pick card + card count, fit verdict shows "可用 … GB") → recipe (highlighted command, working 复制 button with "已复制 ✓" feedback; params/notes/docUrl).
- Pick a command-less recipe path (e.g. a model whose chosen engine has only `notes`, like a TRT-LLM/MindIE entry) and confirm the degraded note shows instead of a command block.
- **Mobile (390×844):** resize, screenshot. Confirm single-column grid, hero font scales down, no horizontal overflow.
Stop the dev server when done.

- [ ] **Step 6: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add web/src/app/page.tsx && git commit -m "feat(ui): assemble aurora wizard orchestrator from components"
```

---

## Task 15: Upgrade GitHub Actions for the mandated Node 24 runtime

**Files:**
- Modify: `.github/workflows/deploy.yml`

Spec leftover: "actions 版本升级…升到支持 Node 24 的版本(GitHub 2026-06 起强制 Node 24)". GitHub is forcing the Node 24 **action runtime**; the older major tags run on a deprecated runtime. Bump each action to the latest major (verified via `gh api .../releases/latest` on 2026-05-29): `checkout@v6`, `setup-node@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`, `pnpm/action-setup@v6`. The project's installed Node (`node-version: '18'`) is unrelated to the action runtime and pnpm 8 targets Node 18 — leave it at `'18'`.

- [ ] **Step 1: Bump `actions/checkout`** — change `uses: actions/checkout@v4` to:
```yaml
        uses: actions/checkout@v6
```

- [ ] **Step 2: Bump `actions/setup-node`** — change `uses: actions/setup-node@v4` to:
```yaml
        uses: actions/setup-node@v6
```

- [ ] **Step 3: Bump `pnpm/action-setup`** — change `uses: pnpm/action-setup@v2` to:
```yaml
        uses: pnpm/action-setup@v6
```

- [ ] **Step 4: Bump `actions/upload-pages-artifact`** — change `uses: actions/upload-pages-artifact@v3` to:
```yaml
        uses: actions/upload-pages-artifact@v5
```

- [ ] **Step 5: Bump `actions/deploy-pages`** — change `uses: actions/deploy-pages@v4` to:
```yaml
        uses: actions/deploy-pages@v5
```

- [ ] **Step 6: Sanity-check the YAML** (no other edits; confirm exactly five `uses:` were bumped)

Run: `cd /Users/fangyong/agent/Mosaic && grep -nE "uses: (actions|pnpm)" .github/workflows/deploy.yml`
Expected output (order may vary):
```
actions/checkout@v6
actions/setup-node@v6
pnpm/action-setup@v6
actions/upload-pages-artifact@v5
actions/deploy-pages@v5
```

- [ ] **Step 7: Commit**

```bash
cd /Users/fangyong/agent/Mosaic && git add .github/workflows/deploy.yml && git commit -m "ci: bump actions to Node 24-runtime majors (checkout/setup-node/pnpm/pages)"
```

---

## Self-Review

**Spec coverage (Plan 2 = P2 + P3 + Plan 1 leftovers):**

*P2 — Full-screen aurora UI:*
- Deep-space aurora design system (palette as CSS vars + Tailwind tokens, multi-focal gradient + grain) → Task 6. ✓
- Full-screen hero (gradient headline + capability pill with model/engine counts) → Task 8. ✓
- Glass wizard card (backdrop-blur + soft shadow) + top step bar → Tasks 6 (`.glass`/`.step-bar`), 9, 14. ✓
- Five steps visually landed; option cards hover-lift/glow, selected cyan ring → Tasks 6 (`.option-card`), 10, 11, 13, 14. ✓
- Responsive (desktop multi-column / mobile single) → `.card-grid` breakpoints + hero `md:` scaling (Task 6), verified Task 14 Step 5. ✓

*P3 — Recipe command card polish:*
- Full recipe render: per-param explanation / known-pitfall notes / status badge (native·partial·community) / docUrl → Tasks 10 (StatusBadge), 13 (RecipeCard). ✓
- One-click copy + feedback; command syntax highlighting → Tasks 4 (highlighter), 12 (CommandBlock). ✓
- Command-less recipe degradation → Task 13 (degraded branch + test). ✓

*Plan 1 leftovers:*
- Enable `getRecipe`/`getRecipeStatus` (engine status filter/sort) → Task 5 (`enginesForModel`), consumed Task 11. ✓
- `FitResult.availableGB` → `totalAvailableGB` (before new consumers) → Task 2. ✓
- vitest `include` extended to `*.test.tsx` (+ RTL) → Task 1. ✓
- Actions bumped for Node 24 runtime → Task 15. ✓

**Acceptance criteria** ("视觉对齐预览;移动端正常;`pnpm test` / `type-check` / `build` 全绿"): visual + mobile verified in Task 14 Step 5; test/type-check/build are explicit gates in Task 14 Steps 2–4. ✓

**Placeholder scan:** No TBD/TODO; every code step ships complete code; the only non-TDD task (Task 6, pure CSS) is gated by `pnpm build`. ✓

**Type consistency:**
- `FitResult.totalAvailableGB` defined in Task 2 is the exact field read by `StepGpu` (Task 11) and the orchestrator's `fit` (Task 14). ✓
- `Segment`/`SegmentKind` from `highlight.ts` (Task 4) — `KIND_CLASS: Record<SegmentKind, string>` in `CommandBlock` (Task 12) covers all four kinds (`flag`/`value`/`cont`/`plain`). ✓
- `enginesForModel(model): EngineId[]` (Task 5) is called with a `ModelEntry` and its result indexed via `getRecipeStatus(model, id)` in `StepEngine` (Task 11). ✓
- `statusMeta(status)` / `STATUS_META` (Task 3) consumed by `StatusBadge` (Task 10) and indirectly `RecipeCard` (Task 13). ✓
- `OptionCard` props (`title`/`icon`/`desc`/`badge`/`selected`/`onClick`) defined in Task 10 are used identically across all step bodies (Task 11) and recipe step. ✓
- `RecipeCard`/`StepRecipe` props (`engineName`/`recipe`/`command`) match between Task 13 definition and the Task 14 caller (`engineName(engineId)`, `recipe`, `command`). ✓
- `STEPS` exported from `StepBar` (Task 9) — the orchestrator drives `current={step}` against the same 5-entry array. ✓
- `buildCommand(recipe, {tp})` / `advise(model.id, gpu, count)` / `getModelsForScenario(scenario)` signatures unchanged from Plan 1, reused verbatim in Task 14. ✓
