import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepGpu } from "@/components/steps/StepGpu";
import type { FitResult } from "@/lib/fit-advisor";

const noop = () => {};

const fitKnown: FitResult = {
  knownSize: true,
  totalAvailableGB: 80,
  requiredGB: 168,
  fits: false,
  recommendedTP: 1,
  suggestQuantization: true,
};

const fitUnknown: FitResult = {
  knownSize: false,
  totalAvailableGB: 160,
  recommendedTP: 1,
  suggestQuantization: false,
};

describe("StepGpu", () => {
  it("disables the next button until a GPU is chosen", () => {
    render(
      <StepGpu gpu={null} count={1} fit={null} onSelectGpu={noop} onCountChange={noop} onNext={noop} />,
    );
    expect(screen.getByRole("button", { name: /查看配方/ })).toBeDisabled();
  });

  it("shows the available memory and quantization hint when the size is known", () => {
    const { container } = render(
      <StepGpu gpu={null} count={1} fit={fitKnown} onSelectGpu={noop} onCountChange={noop} onNext={noop} />,
    );
    expect(container.textContent).toContain("可用 80 GB");
    expect(screen.getByText(/建议使用量化/)).toBeInTheDocument();
  });

  it("shows the no-estimate message when the size is unknown", () => {
    render(
      <StepGpu gpu={null} count={1} fit={fitUnknown} onSelectGpu={noop} onCountChange={noop} onNext={noop} />,
    );
    expect(screen.getByText(/暂无显存估算/)).toBeInTheDocument();
  });

  it("never emits NaN from non-numeric count input", () => {
    const onCountChange = vi.fn();
    render(
      <StepGpu gpu={null} count={1} fit={null} onSelectGpu={noop} onCountChange={onCountChange} onNext={noop} />,
    );
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "abc" } });
    expect(onCountChange).toHaveBeenCalledWith(1);
    expect(Number.isNaN(onCountChange.mock.calls[0][0])).toBe(false);
  });
});
