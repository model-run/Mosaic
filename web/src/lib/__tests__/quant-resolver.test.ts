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
