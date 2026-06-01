import type { EngineRecipe, Precision } from "@/lib/recipes/types";
import { CommandBlock } from "@/components/CommandBlock";
import { StatusBadge } from "@/components/StatusBadge";

const PRECISION_LABEL: Record<Precision, string> = {
  fp16: "FP16", fp8: "FP8", awq: "AWQ", gptq: "GPTQ", gguf: "GGUF",
};

export function RecipeCard({
  engineName,
  recipe,
  command,
  precisions,
  precision,
  onPrecisionChange,
  computed,
}: {
  engineName: string;
  recipe: EngineRecipe;
  command: string | null;
  precisions?: Precision[];
  precision?: Precision;
  onPrecisionChange?: (p: Precision) => void;
  computed?: boolean;
}) {
  const chips = precisions != null && precisions.length > 1 ? precisions : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold text-slate-100">{engineName}</h3>
        <StatusBadge status={recipe.status} />
        {recipe.image && <code className="text-xs text-slate-400">{recipe.image}</code>}
      </div>

      {chips && (
        <div role="group" aria-label="精度" className="flex flex-wrap items-center gap-2">
          {chips.map((p) => (
            <button
              key={p}
              type="button"
              className={`quant-chip${p === precision ? " is-selected" : ""}`}
              aria-pressed={p === precision}
              onClick={() => onPrecisionChange?.(p)}
            >
              {PRECISION_LABEL[p]}
            </button>
          ))}
          {computed && <span className="text-xs text-amber-300">推导命令 · 非实测</span>}
        </div>
      )}

      {command ? (
        <CommandBlock command={command} />
      ) : (
        <div className="degraded-note">
          该配方需预编译 / 预处理，暂无一键命令。请参考下方说明与官方文档。
          {recipe.notes ? `（${recipe.notes}）` : ""}
        </div>
      )}

      {recipe.params && recipe.params.length > 0 && (
        <ul className="param-list">
          {recipe.params.map((p) => (
            <li key={p.key}>
              <code className="text-cyan-300">
                {p.key} {p.value}
              </code>
              <span className="text-slate-400"> — </span>
              <span className="text-slate-400">{p.desc}</span>
            </li>
          ))}
        </ul>
      )}

      {recipe.resource && <p className="text-sm text-slate-400">资源建议：{recipe.resource}</p>}
      {command && recipe.notes && <p className="text-sm text-amber-300">⚠️ 已知坑：{recipe.notes}</p>}
      {recipe.docUrl && (
        <a
          className="text-sm text-cyan-300 underline underline-offset-2"
          href={recipe.docUrl}
          target="_blank"
          rel="noreferrer"
        >
          官方文档 ↗
        </a>
      )}
    </div>
  );
}
