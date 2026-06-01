import type { EngineId, ModelEntry, RecipeStatus } from "@/lib/recipes/types";
import { getRecipe, getRecipeStatus } from "@/lib/recipes/data";

// Display rank: native first, then partial, then community.
// "none" is filtered out below (absent engines have no recipe; explicit "none" is dropped).
const STATUS_RANK: Record<RecipeStatus, number> = {
  native: 0,
  partial: 1,
  community: 2,
  none: 3,
};

/**
 * Engine ids that have a recipe for this model, sorted by support status
 * (native → partial → community). Engines with no recipe are dropped.
 */
export function enginesForModel(model: ModelEntry): EngineId[] {
  return (Object.keys(model.engines) as EngineId[])
    // Drop engines with no recipe AND any explicitly marked "none" (known not to work).
    .filter((id) => getRecipe(model, id) !== undefined && getRecipeStatus(model, id) !== "none")
    .sort(
      (a, b) => STATUS_RANK[getRecipeStatus(model, a)] - STATUS_RANK[getRecipeStatus(model, b)],
    );
}
