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
