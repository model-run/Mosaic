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
    expect(r.totalAvailableGB).toBe(80); // 80GB × 1 card
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
