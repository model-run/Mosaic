"use client";

import { useState } from "react";
import type { GPUInfo } from "@/types";
import type { ModelEntry, EngineId, EngineRecipe } from "@/lib/recipes/types";
import { ENGINES } from "@/lib/recipes/engines";
import { SCENARIOS, getModelsForScenario, type ScenarioId } from "@/lib/recipes/scenarios";
import { gpuData } from "@/lib/gpu-data";
import { advise } from "@/lib/fit-advisor";
import { buildCommand } from "@/lib/command-builder";

const STEPS = ["场景", "模型", "引擎", "GPU 校验", "配方命令"];

export default function Home() {
  const [step, setStep] = useState(0);
  const [scenario, setScenario] = useState<ScenarioId | null>(null);
  const [model, setModel] = useState<ModelEntry | null>(null);
  const [engineId, setEngineId] = useState<EngineId | null>(null);
  const [gpu, setGpu] = useState<GPUInfo | null>(null);
  const [count, setCount] = useState(1);

  const models = scenario ? getModelsForScenario(scenario) : [];
  const recipe: EngineRecipe | undefined =
    model && engineId ? model.engines[engineId] : undefined;
  const fit = model && gpu ? advise(model.id, gpu, count) : null;
  const command = recipe ? buildCommand(recipe, fit ? { tp: fit.recommendedTP } : {}) : null;

  const engineName = (id: EngineId) => ENGINES.find((e) => e.id === id)?.name ?? id;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <h1 className="text-3xl font-bold mb-2">ModelRun.io</h1>
      <p className="text-slate-400 mb-6">从场景出发,生成可跑的部署命令</p>

      <ol className="flex gap-2 mb-8 text-sm">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? "text-cyan-400 font-semibold" : "text-slate-500"}>
            {i + 1}. {s}{i < STEPS.length - 1 ? " ›" : ""}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => { setScenario(s.id); setModel(null); setEngineId(null); setStep(1); }}
              className={`text-left p-5 rounded-xl border ${scenario === s.id ? "border-cyan-400" : "border-slate-700"} hover:border-cyan-400`}
            >
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="font-semibold">{s.label}</div>
              <div className="text-sm text-slate-400 mt-1">{s.desc}</div>
            </button>
          ))}
        </section>
      )}

      {step === 1 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((m) => (
            <button
              key={m.id}
              onClick={() => { setModel(m); setEngineId(null); setStep(2); }}
              className={`text-left p-5 rounded-xl border ${model?.id === m.id ? "border-cyan-400" : "border-slate-700"} hover:border-cyan-400`}
            >
              <div className="font-semibold">{m.name}</div>
              <div className="text-sm text-slate-400 mt-1">{m.meta}</div>
            </button>
          ))}
        </section>
      )}

      {step === 2 && model && (
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(Object.keys(model.engines) as EngineId[]).map((id) => {
            const r = model.engines[id]!;
            return (
              <button
                key={id}
                onClick={() => { setEngineId(id); setStep(3); }}
                className={`text-left p-4 rounded-xl border ${engineId === id ? "border-cyan-400" : "border-slate-700"} hover:border-cyan-400`}
              >
                <div className="font-semibold">{engineName(id)}</div>
                <div className="text-xs mt-1 inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300">{r.status}</div>
              </button>
            );
          })}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4 max-w-xl">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gpuData.map((g) => (
              <button
                key={g.id}
                onClick={() => setGpu(g)}
                className={`text-left p-3 rounded-lg border ${gpu?.id === g.id ? "border-cyan-400" : "border-slate-700"} hover:border-cyan-400`}
              >
                <div className="font-medium text-sm">{g.name}</div>
                <div className="text-xs text-slate-400">{g.memory} GB</div>
              </button>
            ))}
          </div>
          <label className="block text-sm">
            卡数:
            <input type="number" min={1} value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
              className="ml-2 w-20 bg-slate-800 rounded px-2 py-1" />
          </label>
          {fit && (
            <div className="text-sm text-slate-300 rounded-lg bg-slate-900 p-4">
              {fit.knownSize ? (
                <>
                  <div>需要约 {fit.requiredGB?.toFixed(0)} GB / 可用 {fit.totalAvailableGB} GB — {fit.fits ? "✅ 跑得动" : "⚠️ 显存不足"}</div>
                  <div>推荐 tensor-parallel-size: {fit.recommendedTP}</div>
                  {fit.suggestQuantization && <div className="text-amber-400">建议使用量化(AWQ/FP8)以放入当前显存</div>}
                </>
              ) : (
                <div>该模型暂无显存估算,请参考下一步配方中的资源建议。</div>
              )}
            </div>
          )}
          <button disabled={!gpu} onClick={() => setStep(4)}
            className="px-5 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold disabled:opacity-40">
            查看配方 →
          </button>
        </section>
      )}

      {step === 4 && recipe && (
        <section className="space-y-4 max-w-3xl">
          {command ? (
            <pre className="bg-black rounded-xl p-4 overflow-x-auto text-sm text-emerald-300 whitespace-pre">{command}</pre>
          ) : (
            <div className="rounded-xl bg-slate-900 p-4 text-slate-300">
              该引擎需预处理,暂无一键命令。{recipe.notes ?? ""}
            </div>
          )}
          {recipe.params && recipe.params.length > 0 && (
            <ul className="text-sm space-y-1">
              {recipe.params.map((p) => (
                <li key={p.key}><code className="text-cyan-400">{p.key} {p.value}</code> — <span className="text-slate-400">{p.desc}</span></li>
              ))}
            </ul>
          )}
          {recipe.resource && <p className="text-sm text-slate-400">资源建议:{recipe.resource}</p>}
          {command && recipe.notes && <p className="text-sm text-amber-300">⚠️ {recipe.notes}</p>}
          {recipe.docUrl && <a className="text-sm text-cyan-400 underline" href={recipe.docUrl} target="_blank" rel="noreferrer">官方文档 ↗</a>}
        </section>
      )}

      {step > 0 && (
        <button onClick={() => setStep(step - 1)} className="mt-8 text-sm text-slate-400 hover:text-slate-200">← 上一步</button>
      )}
    </main>
  );
}
