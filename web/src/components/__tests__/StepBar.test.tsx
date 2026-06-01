import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StepBar, STEPS } from "@/components/StepBar";

describe("StepBar", () => {
  it("defines the five wizard steps", () => {
    expect(STEPS).toEqual(["场景", "模型", "引擎", "GPU 校验", "配方命令"]);
  });

  it("marks the current step active and earlier steps done", () => {
    const { container } = render(<StepBar current={1} />);
    expect(container.querySelector(".active")?.textContent).toContain("模型");
    expect(container.querySelector(".done")?.textContent).toContain("场景");
  });
});
