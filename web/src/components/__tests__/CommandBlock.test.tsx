import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommandBlock } from "@/components/CommandBlock";

const CMD = "docker run --tensor-parallel-size 8 vllm/vllm-openai:v0.7.3";

describe("CommandBlock", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders the command text", () => {
    const { container } = render(<CommandBlock command={CMD} />);
    expect(container.querySelector(".cmd-pre")?.textContent).toBe(CMD);
  });

  it("highlights flags with the cyan class", () => {
    const { container } = render(<CommandBlock command={CMD} />);
    const flag = Array.from(container.querySelectorAll("span")).find(
      (s) => s.textContent === "--tensor-parallel-size",
    );
    expect(flag?.className).toContain("text-cyan-300");
  });

  it("copies to clipboard and shows feedback on click", async () => {
    render(<CommandBlock command={CMD} />);
    fireEvent.click(screen.getByText("复制"));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(CMD);
    expect(await screen.findByText("已复制 ✓")).toBeInTheDocument();
  });
});
