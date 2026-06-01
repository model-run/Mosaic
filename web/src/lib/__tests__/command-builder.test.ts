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
const lmdeploy: EngineRecipe = {
  status: "native",
  command: "lmdeploy serve api_server Qwen/Qwen2.5-7B --tp 1",
};
const tgi: EngineRecipe = {
  status: "native",
  command: "docker run ghcr.io/huggingface/text-generation-inference --model-id X",
};

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
});
