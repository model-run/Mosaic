import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AuroraBackground } from "@/components/AuroraBackground";

describe("AuroraBackground", () => {
  it("renders the aurora and grain layers", () => {
    const { container } = render(<AuroraBackground />);
    expect(container.querySelector(".aurora-bg")).toBeInTheDocument();
    expect(container.querySelector(".grain")).toBeInTheDocument();
  });
});
