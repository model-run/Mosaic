import type { ModelEntry } from "@/lib/recipes/types";
import { OptionCard } from "@/components/OptionCard";

export function StepModel({
  models,
  selected,
  onSelect,
}: {
  models: ModelEntry[];
  selected: ModelEntry | null;
  onSelect: (m: ModelEntry) => void;
}) {
  return (
    <div>
      <div className="step-label">STEP 02</div>
      <h2 className="step-q">选择模型</h2>
      <div className="card-grid">
        {models.map((m) => (
          <OptionCard
            key={m.id}
            title={m.name}
            desc={m.meta}
            selected={selected?.id === m.id}
            onClick={() => onSelect(m)}
          />
        ))}
      </div>
    </div>
  );
}
