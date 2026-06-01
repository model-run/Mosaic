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
