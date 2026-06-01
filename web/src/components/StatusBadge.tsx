import type { RecipeStatus } from "@/lib/recipes/types";
import { statusMeta } from "@/lib/status";

export function StatusBadge({ status }: { status: RecipeStatus }) {
  const { label, className } = statusMeta(status);
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
