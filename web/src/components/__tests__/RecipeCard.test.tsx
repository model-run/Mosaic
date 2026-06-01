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
    expect(screen.getByText(/TensorRT-LLM 需先 trtllm-build/)).toBeInTheDocument();
  });
});
