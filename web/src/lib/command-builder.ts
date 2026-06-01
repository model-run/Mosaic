import type { EngineRecipe, EngineId, Precision } from "@/lib/recipes/types";

export interface BuildOpts {
  /** Override tensor-parallel size in the command, if present. */
  tp?: number;
  /** Target quantization. "fp16" / undefined leaves quantization untouched. */
  quantization?: Precision;
  /** Engine the recipe belongs to — selects the quant-flag rule. When omitted, defaults to the vllm-style `--quantization` flag. */
  engineId?: EngineId;
}

/** Set or replace a single-valued flag (`--flag VALUE`). Appends if absent. */
function setFlag(cmd: string, flag: string, value: string): string {
  // value token must not itself be a flag (avoids eating a following --flag)
  const re = new RegExp(`(${flag}\\s+)(?!--)\\S+`);
  if (re.test(cmd)) return cmd.replace(re, `$1${value}`);
  return `${cmd} ${flag} ${value}`;
}

/**
 * Returns the recipe command with tensor-parallel and quantization rewritten.
 * - tp: rewrites `--tensor-parallel-size N` / `--tp N` in place.
 * - quantization: appends the engine-specific quant flag. "fp16"/undefined and
 *   engines with no rule leave the command unchanged (degrade-safe).
 * Returns null when the recipe carries no command.
 */
export function buildCommand(recipe: EngineRecipe, opts: BuildOpts = {}): string | null {
  if (!recipe.command) return null;
  let cmd = recipe.command;

  if (opts.tp != null) {
    cmd = cmd
      .replace(/(--tensor-parallel-size\s+)\d+/g, `$1${opts.tp}`)
      .replace(/(--tp\s+)\d+/g, `$1${opts.tp}`);
  }

  const q = opts.quantization;
  if (q && q !== "fp16") {
    cmd = applyQuant(cmd, q, opts.engineId);
  }
  return cmd;
}

/** [flag, value] pairs a computed quant variant adds for this engine, in order. Empty = no CLI flag. */
function quantFlagPairs(q: Precision, engineId?: EngineId): Array<[string, string]> {
  // vllm/sglang share `--quantization`; default to it when engineId is absent.
  const eng = engineId ?? "vllm";
  switch (eng) {
    case "vllm":
    case "vllm-ascend":
    case "sglang":
    // trtllm/mindie runtime --quantization is best-effort (often require build-time quant).
    case "trtllm":
    case "mindie":
      return [["--quantization", q]];
    case "tgi":
      return [["--quantize", q]];
    case "lmdeploy":
      // lmdeploy expresses weight-only quant via model-format + quant-policy.
      return q === "awq" || q === "gptq"
        ? [["--model-format", q], ["--quant-policy", "4"]]
        : []; // fp8/other: no flag here, handled at the variant level
    case "llamacpp": // gguf is carried by the model file, not a flag
    case "tei":
    case "infinity":
    case "comfyui":
    default:
      return [];
  }
}

function applyQuant(cmd: string, q: Precision, engineId?: EngineId): string {
  for (const [flag, value] of quantFlagPairs(q, engineId)) {
    cmd = setFlag(cmd, flag, value);
  }
  return cmd;
}

/**
 * Human-readable flag string a computed variant adds for this engine
 * (e.g. "--quantization awq", "--model-format awq --quant-policy 4"),
 * or null when the engine encodes quantization outside the CLI (e.g. gguf) or for fp16.
 */
export function quantFlagString(engineId: EngineId | undefined, q: Precision): string | null {
  if (q === "fp16") return null;
  const pairs = quantFlagPairs(q, engineId);
  if (pairs.length === 0) return null;
  return pairs.map(([f, v]) => `${f} ${v}`).join(" ");
}
