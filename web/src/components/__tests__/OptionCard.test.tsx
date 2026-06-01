import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OptionCard } from "@/components/OptionCard";

describe("OptionCard", () => {
  it("renders title + desc and fires onClick", () => {
    const onClick = vi.fn();
    render(<OptionCard title="vLLM" desc="UC Berkeley" onClick={onClick} />);
    expect(screen.getByText("vLLM")).toBeInTheDocument();
    expect(screen.getByText("UC Berkeley")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("adds the is-selected class when selected", () => {
    render(<OptionCard title="vLLM" selected onClick={() => {}} />);
    expect(screen.getByRole("button").className).toContain("is-selected");
  });
});
