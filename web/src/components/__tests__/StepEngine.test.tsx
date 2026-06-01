import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepEngine } from "@/components/steps/StepEngine";
import type { ModelEntry } from "@/lib/recipes/types";

const model: ModelEntry = {
  id: "m",
  name: "M",
  category: "dense",
  meta: "x",
  engines: {
    lmdeploy: { status: "community", command: "x" },
    vllm: { status: "native", command: "x" },
  },
};

describe("StepEngine", () => {
  it("lists engines status-ordered (native first) with a badge, and reports the pick", () => {
    const onSelect = vi.fn();
    render(<StepEngine model={model} selected={null} onSelect={onSelect} />);

    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(["vLLM", "LMDeploy"]); // native before community

    expect(screen.getByText("原生支持")).toBeInTheDocument();
    expect(screen.getByText("社区方案")).toBeInTheDocument();

    fireEvent.click(screen.getByText("vLLM"));
    expect(onSelect).toHaveBeenCalledWith("vllm");
  });
});
