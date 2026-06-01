import type { GPUInfo } from "@/types";
import type { FitResult } from "@/lib/fit-advisor";
import { gpuData } from "@/lib/gpu-data";
import { OptionCard } from "@/components/OptionCard";

export function StepGpu({
  gpu,
  count,
  fit,
  onSelectGpu,
  onCountChange,
  onNext,
}: {
  gpu: GPUInfo | null;
  count: number;
  fit: FitResult | null;
  onSelectGpu: (g: GPUInfo) => void;
  onCountChange: (n: number) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="step-label">STEP 04</div>
      <h2 className="step-q">校验显存是否够用</h2>
      <div className="card-grid">
        {gpuData.map((g) => (
          <OptionCard
            key={g.id}
            title={g.name}
            desc={`${g.memory} GB · ${g.tier}`}
            selected={gpu?.id === g.id}
            onClick={() => onSelectGpu(g)}
          />
        ))}
      </div>

      <label className="mt-5 flex items-center gap-3 text-sm text-slate-300">
        卡数
        <input
          type="number"
          min={1}
          value={count}
          onChange={(e) => onCountChange(Math.max(1, Number(e.target.value) || 1))}
          className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-100"
        />
      </label>

      {fit && (
        <div className="fit-panel">
          {fit.knownSize ? (
            <>
              <div>
                需要约 {fit.requiredGB?.toFixed(0)} GB / 可用 {fit.totalAvailableGB} GB —{" "}
                {fit.fits ? "✅ 跑得动" : "⚠️ 显存不足"}
              </div>
              <div className="mt-1 text-slate-400">推荐 tensor-parallel-size：{fit.recommendedTP}</div>
              {fit.suggestQuantization && (
                <div className="mt-1 text-amber-300">建议使用量化（AWQ/FP8）以放入当前显存</div>
              )}
            </>
          ) : (
            <div>该模型暂无显存估算，请参考下一步配方中的资源建议。</div>
          )}
        </div>
      )}

      <button type="button" disabled={!gpu} onClick={onNext} className="gradient-btn mt-6 disabled:opacity-40">
        查看配方 →
      </button>
    </div>
  );
}
