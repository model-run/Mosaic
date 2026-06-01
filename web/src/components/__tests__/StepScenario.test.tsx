import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepScenario } from "@/components/steps/StepScenario";

describe("StepScenario", () => {
  it("renders all six scenarios and reports the picked id", () => {
    const onSelect = vi.fn();
    render(<StepScenario selected={null} onSelect={onSelect} />);
    expect(screen.getAllByRole("button")).toHaveLength(6);
    fireEvent.click(screen.getByText("对话 / 助手"));
    expect(onSelect).toHaveBeenCalledWith("chat");
  });
});
