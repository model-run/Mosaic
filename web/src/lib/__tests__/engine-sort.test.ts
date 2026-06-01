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
    tgi: { status: "none", command: "x" },
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

  it("excludes engines explicitly marked status 'none'", () => {
    expect(enginesForModel(fake)).not.toContain("tgi");
    expect(enginesForModel(fake)).toEqual(["vllm", "sglang", "lmdeploy"]);
  });
});
