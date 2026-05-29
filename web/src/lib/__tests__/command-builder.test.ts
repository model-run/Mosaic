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
