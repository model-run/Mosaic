import { describe, it, expect } from "vitest";
import { CATEGORY_ORDER } from "@/lib/recipes/types";

describe("recipe types", () => {
  it("exposes the 6 categories in display order", () => {
    expect(CATEGORY_ORDER).toEqual([
      "dense", "moe", "vlm", "embedding", "rerank", "diffusion",
    ]);
  });
});
