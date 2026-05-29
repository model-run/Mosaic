import { describe, it, expect } from "vitest";
import { ENGINES } from "@/lib/recipes/engines";

describe("engines", () => {
  it("lists all 11 engines", () => {
    expect(ENGINES).toHaveLength(11);
  });
  it("includes vllm and vllm-ascend", () => {
    const ids = ENGINES.map((e) => e.id);
    expect(ids).toContain("vllm");
    expect(ids).toContain("vllm-ascend");
  });
});
