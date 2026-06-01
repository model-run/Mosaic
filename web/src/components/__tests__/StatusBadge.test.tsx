import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/StatusBadge";

describe("StatusBadge", () => {
  it("renders the zh-CN label for a status", () => {
    render(<StatusBadge status="native" />);
    expect(screen.getByText("原生支持")).toBeInTheDocument();
  });
});
