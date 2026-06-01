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
