import type { EngineRecipe } from "@/lib/recipes/types";

export interface BuildOpts {
  /** Override tensor-parallel size in the command, if present. */
  tp?: number;
}

/**
 * Returns the recipe command with the tensor-parallel value rewritten to
 * `opts.tp` (handles both vLLM `--tensor-parallel-size N` and SGLang/LMDeploy
 * `--tp N`). Returns the command unchanged when no opts are given, and `null`
 * when the recipe carries no command (UI should show notes/docUrl instead).
 */
export function buildCommand(recipe: EngineRecipe, opts: BuildOpts = {}): string | null {
  if (!recipe.command) return null;
  let cmd = recipe.command;
  if (opts.tp != null) {
    cmd = cmd
      .replace(/(--tensor-parallel-size\s+)\d+/g, `$1${opts.tp}`)
      .replace(/(--tp\s+)\d+/g, `$1${opts.tp}`);
  }
  return cmd;
}
