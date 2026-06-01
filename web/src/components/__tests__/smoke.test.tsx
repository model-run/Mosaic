import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

function Hi() {
  return <p>hello aurora</p>;
}

describe("rtl + jsdom infra", () => {
  it("renders a component and matches jest-dom", () => {
    render(<Hi />);
    expect(screen.getByText("hello aurora")).toBeInTheDocument();
  });
});
