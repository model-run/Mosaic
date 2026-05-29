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
