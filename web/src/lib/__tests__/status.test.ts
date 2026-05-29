import { describe, it, expect } from "vitest";
import { statusMeta, STATUS_META } from "@/lib/status";

describe("status metadata", () => {
  it("labels all four statuses in zh-CN", () => {
    expect(statusMeta("native").label).toBe("原生支持");
    expect(statusMeta("partial").label).toBe("部分支持");
    expect(statusMeta("community").label).toBe("社区方案");
    expect(statusMeta("none").label).toBe("暂不支持");
  });

  it("every status carries a non-empty badge className", () => {
    for (const key of Object.keys(STATUS_META)) {
      expect(STATUS_META[key as keyof typeof STATUS_META].className.length).toBeGreaterThan(0);
    }
  });
});
