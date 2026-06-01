import { SCENARIOS, type ScenarioId } from "@/lib/recipes/scenarios";
import { OptionCard } from "@/components/OptionCard";

export function StepScenario({
  selected,
  onSelect,
}: {
  selected: ScenarioId | null;
  onSelect: (id: ScenarioId) => void;
}) {
  return (
    <div>
      <div className="step-label">STEP 01</div>
      <h2 className="step-q">你想用模型来做什么？</h2>
      <div className="card-grid">
        {SCENARIOS.map((s) => (
          <OptionCard
            key={s.id}
            icon={s.icon}
            title={s.label}
            desc={s.desc}
            selected={selected === s.id}
            onClick={() => onSelect(s.id)}
          />
        ))}
      </div>
    </div>
  );
}
