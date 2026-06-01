import type { ModelEntry, EngineId } from "@/lib/recipes/types";
import { ENGINES } from "@/lib/recipes/engines";
import { getRecipeStatus } from "@/lib/recipes/data";
import { enginesForModel } from "@/lib/engine-sort";
import { OptionCard } from "@/components/OptionCard";
import { StatusBadge } from "@/components/StatusBadge";

const engineName = (id: EngineId) => ENGINES.find((e) => e.id === id)?.name ?? id;

export function StepEngine({
  model,
  selected,
  onSelect,
}: {
  model: ModelEntry;
  selected: EngineId | null;
  onSelect: (id: EngineId) => void;
}) {
  const ids = enginesForModel(model);
  return (
    <div>
      <div className="step-label">STEP 03</div>
      <h2 className="step-q">选择推理引擎</h2>
      <div className="card-grid">
        {ids.map((id) => (
          <OptionCard
            key={id}
            title={engineName(id)}
            badge={<StatusBadge status={getRecipeStatus(model, id)} />}
            selected={selected === id}
            onClick={() => onSelect(id)}
          />
        ))}
      </div>
    </div>
  );
}
