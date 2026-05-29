import { describe, it, expect } from "vitest";
import { SCENARIOS, getModelsForScenario } from "@/lib/recipes/scenarios";

describe("scenarios", () => {
  it("defines six scenarios", () => {
    expect(SCENARIOS).toHaveLength(6);
  });

  it("chat returns only dense models", () => {
    const models = getModelsForScenario("chat");
    expect(models.length).toBeGreaterThan(0);
    expect(models.every((m) => m.category === "dense")).toBe(true);
  });

  it("multimodal returns only vlm models", () => {
    const models = getModelsForScenario("multimodal");
    expect(models.every((m) => m.category === "vlm")).toBe(true);
  });

  it("returns [] for an unknown scenario id", () => {
    // @ts-expect-error testing runtime guard
    expect(getModelsForScenario("nope")).toEqual([]);
  });
});
