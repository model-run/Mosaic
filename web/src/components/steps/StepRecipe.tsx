import type { EngineRecipe, Precision } from "@/lib/recipes/types";
import { RecipeCard } from "@/components/RecipeCard";

export function StepRecipe({
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
  precisions: Precision[];
  precision: Precision;
  onPrecisionChange: (p: Precision) => void;
  computed: boolean;
}) {
  return (
    <div>
      <div className="step-label">STEP 05</div>
      <h2 className="step-q">复制即可运行的配方</h2>
      <RecipeCard
        engineName={engineName}
        recipe={recipe}
        command={command}
        precisions={precisions}
        precision={precision}
        onPrecisionChange={onPrecisionChange}
        computed={computed}
      />
    </div>
  );
}
