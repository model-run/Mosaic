"use client";

import { useState } from "react";
import type { GPUInfo } from "@/types";
import type { ModelEntry, EngineId, EngineRecipe } from "@/lib/recipes/types";
import { engineName } from "@/lib/recipes/engines";
import { getModelsForScenario, type ScenarioId } from "@/lib/recipes/scenarios";
import { advise } from "@/lib/fit-advisor";
import { buildCommand } from "@/lib/command-builder";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Hero } from "@/components/Hero";
import { StepBar } from "@/components/StepBar";
import { StepScenario } from "@/components/steps/StepScenario";
import { StepModel } from "@/components/steps/StepModel";
import { StepEngine } from "@/components/steps/StepEngine";
import { StepGpu } from "@/components/steps/StepGpu";
import { StepRecipe } from "@/components/steps/StepRecipe";

export default function Home() {
  const [step, setStep] = useState(0);
  const [scenario, setScenario] = useState<ScenarioId | null>(null);
  const [model, setModel] = useState<ModelEntry | null>(null);
  const [engineId, setEngineId] = useState<EngineId | null>(null);
  const [gpu, setGpu] = useState<GPUInfo | null>(null);
  const [count, setCount] = useState(1);

  const models = scenario ? getModelsForScenario(scenario) : [];
  const recipe: EngineRecipe | undefined = model && engineId ? model.engines[engineId] : undefined;
  const fit = model && gpu ? advise(model.id, gpu, count) : null;
  const command = recipe ? buildCommand(recipe, fit ? { tp: fit.recommendedTP } : {}) : null;

  return (
    <main className="relative min-h-screen text-slate-100">
      <AuroraBackground />
      <div className="relative z-10">
        <Hero />
        <div className="wizard-stage">
          <div className="glass">
            <StepBar current={step} />
            <div className="glass-body">
              {step === 0 && (
                <StepScenario
                  selected={scenario}
                  onSelect={(id) => {
                    setScenario(id);
                    setModel(null);
                    setEngineId(null);
                    setStep(1);
                  }}
                />
              )}
              {step === 1 && (
                <StepModel
                  models={models}
                  selected={model}
                  onSelect={(m) => {
                    setModel(m);
                    setEngineId(null);
                    setStep(2);
                  }}
                />
              )}
              {step === 2 && model && (
                <StepEngine
                  model={model}
                  selected={engineId}
                  onSelect={(id) => {
                    setEngineId(id);
                    setStep(3);
                  }}
                />
              )}
              {step === 3 && (
                <StepGpu
                  gpu={gpu}
                  count={count}
                  fit={fit}
                  onSelectGpu={setGpu}
                  onCountChange={setCount}
                  onNext={() => setStep(4)}
                />
              )}
              {step === 4 && recipe && engineId && (
                <StepRecipe engineName={engineName(engineId)} recipe={recipe} command={command} />
              )}

              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="mt-8 text-sm text-slate-400 transition-colors hover:text-slate-200"
                >
                  ← 上一步
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
