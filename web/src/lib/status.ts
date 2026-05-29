import type { RecipeStatus } from "@/lib/recipes/types";

export interface StatusMeta {
  /** zh-CN badge label. */
  label: string;
  /** Tailwind classes: border + text + tinted background for the badge. */
  className: string;
}

export const STATUS_META: Record<RecipeStatus, StatusMeta> = {
  native: { label: "原生支持", className: "border-emerald-400/40 text-emerald-300 bg-emerald-400/10" },
  partial: { label: "部分支持", className: "border-amber-400/40 text-amber-300 bg-amber-400/10" },
  community: { label: "社区方案", className: "border-violet-400/40 text-violet-300 bg-violet-400/10" },
  none: { label: "暂不支持", className: "border-white/15 text-slate-400 bg-white/5" },
};

export function statusMeta(status: RecipeStatus): StatusMeta {
  return STATUS_META[status];
}
