import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Hero } from "@/components/Hero";
import { ENGINES } from "@/lib/recipes/engines";
import { MODELS } from "@/lib/recipes/data";

describe("Hero", () => {
  it("renders the gradient headline", () => {
    const { container } = render(<Hero />);
    expect(container.querySelector(".gradient-text")?.textContent).toContain("可跑的部署命令");
  });

  it("shows live model and engine counts in the capability pill", () => {
    const { container } = render(<Hero />);
    const text = container.textContent ?? "";
    expect(text).toContain(`${MODELS.length}`);
    expect(text).toContain(`${ENGINES.length} 大推理引擎`);
  });
});
