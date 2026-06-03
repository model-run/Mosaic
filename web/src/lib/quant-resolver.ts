import type { EngineId, EngineRecipe, Precision, RecipeParam } from "@/lib/recipes/types";
import { QUANT_SUPPORT } from "@/lib/recipes/quant-support";
import { buildCommand, quantFlagString } from "@/lib/command-builder";

export interface ResolvedRecipe {
  command: string | null;
  image?: string;
  params?: RecipeParam[];
  resource?: string;
  notes?: string;
  /** true when the command was derived by rule rather than base/hand-written. */
  computed: boolean;
}

/**
 * Precisions the UI should offer for this cell, in QUANT_SUPPORT order.
 * fp16 is always present; a non-fp16 precision is offered when the recipe has a
 * base command (computable) or a hand-written variant for it.
 */
export function availablePrecisions(recipe: EngineRecipe, engineId: EngineId): Precision[] {
  const supported = QUANT_SUPPORT[engineId] ?? ["fp16"];
  return supported.filter(
    (p) => p === "fp16" || recipe.variants?.[p] != null || recipe.command != null,
  );
}

/** Resolve the display fields for a given precision: base / override / computed. */
export function resolveVariant(
  recipe: EngineRecipe,
  engineId: EngineId,
  precision: Precision,
  opts: { tp?: number } = {},
): ResolvedRecipe {
  // 1. base
  if (precision === "fp16") {
    return {
      command: buildCommand(recipe, { tp: opts.tp }),
      image: recipe.image,
      params: recipe.params ? [...recipe.params] : undefined,
      resource: recipe.resource,
      notes: recipe.notes,
      computed: false,
    };
  }

  // 2. hand-written override (merged over base)
  const ov = recipe.variants?.[precision];
  if (ov) {
    const merged: EngineRecipe = { ...recipe, command: ov.command ?? recipe.command };
    return {
      command: buildCommand(merged, { tp: opts.tp }),
      image: ov.image ?? recipe.image,
      params: ov.params ?? (recipe.params ? [...recipe.params] : undefined),
      resource: ov.resource ?? recipe.resource,
      notes: ov.notes ?? recipe.notes,
      computed: false,
    };
  }

  // 3. computed — the "非实测" caveat is surfaced via the `computed` flag (inline UI tag)
  //    and the "（推导）" param desc; it is not duplicated into notes.
  const command = buildCommand(recipe, { tp: opts.tp, quantization: precision, engineId });
  // No base command to derive from → degrade to a safe, non-contradictory result.
  if (command == null) {
    return {
      command: null,
      image: recipe.image,
      params: recipe.params ? [...recipe.params] : undefined,
      resource: recipe.resource,
      notes: recipe.notes,
      computed: false,
    };
  }
  const flag = quantFlagString(engineId, precision);
  const params = flag
    ? [...(recipe.params ?? []), { key: flag, value: "", desc: `量化精度（推导）：${precision}` }]
    : recipe.params
      ? [...recipe.params]
      : undefined;
  return {
    command,
    image: recipe.image,
    params,
    resource: recipe.resource,
    notes: recipe.notes,
    computed: true,
  };
}
