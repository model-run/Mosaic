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

function applyQuant(cmd: string, q: Precision, engineId?: EngineId): string {
  // vllm/sglang share `--quantization`; default to it when engineId is absent.
  const eng = engineId ?? "vllm";
  switch (eng) {
    // trtllm and mindie --quantization is best-effort: these engines often require build-time quant.
    case "vllm":
    case "vllm-ascend":
    case "sglang":
    case "trtllm":
    case "mindie":
      return setFlag(cmd, "--quantization", q);
    case "tgi":
      return setFlag(cmd, "--quantize", q);
    case "lmdeploy":
      // lmdeploy expresses weight-only quant via model-format + quant-policy.
      // fp8 and other precisions need no flag here — handled at the variant level.
      return q === "awq" || q === "gptq"
        ? setFlag(setFlag(cmd, "--model-format", q), "--quant-policy", "4")
        : cmd;
    case "llamacpp": // gguf is carried by the model file, not a flag
    case "tei":
    case "infinity":
    case "comfyui":
    default:
      return cmd;
  }
}
