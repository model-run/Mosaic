# Mosaic 量化变体矩阵(方案 3)— 设计

**Status:** Approved · 2026-06-01
**Author:** weetime (with Claude)
**Driver:** 在已合并的 Plan 1(配方数据底座 + 向导逻辑)与 Plan 2(全屏深空极光 UI + 配方卡)之上,落地 spec §2.3 挂起的「量化变体矩阵」:让用户在第 5 步配方卡上切换量化精度(FP16/FP8/AWQ/GPTQ/GGUF),实时得到对应的部署命令与显存评估。

---

## 1. Why

当前每个「模型 × 引擎」配方只携带**单条** `command`/`image`/`params`(Plan 1 从 modeldoctor 移植时未带变体数据)。但 `fit-advisor.ts` 已经预留了 `Precision = "fp16" | "fp8" | "awq" | "gptq" | "gguf"`,`advise()` 也接受 `precision` 并按精度算 `requiredGB` + 返回 `suggestQuantization` 标志——计算侧已半就绪,缺的是:

1. 配方数据模型没有「变体」概念。
2. `command-builder` 只重写 tensor-parallel,不会按量化改写命令。
3. UI 没有暴露精度选择入口。

量化是配方真正的卖点之一(同一张卡能否跑得动,往往取决于量化),补齐变体矩阵直接增厚核心数据价值。

## 2. 已拍板决策

| 决策点 | 选择 |
|---|---|
| 变体来源 | **混合**:计算层按引擎规则从 base(fp16)推导量化命令打底;允许少量高价值格子手写真实变体覆盖(降级安全) |
| 量化入口 | **第 5 步配方卡上切换**(精度胶囊行),与第 4 步 GPU 校验状态解耦 |
| 格式范围 | **引擎能力表驱动全 5 种**(fp16/fp8/awq/gptq/gguf);某格子可选精度 = base fp16 ∩ 该引擎能力表 ∩ (有 command 或有手写 variant) |
| 部署形态 | 保持纯静态(Next.js static export → `docs/` → GitHub Pages,零后端) |

### 2.1 In Scope

- `Precision` 类型上移集中到 `recipes/types.ts`(消除与 fit-advisor 的重复定义)。
- `EngineRecipe` 新增可选 `variants` 字段;新增 `QuantVariant` 类型(手写覆盖)。
- 新增引擎能力表 `recipes/quant-support.ts`。
- 新增 `lib/quant-resolver.ts`:base / 手写覆盖 / 计算 三分支解析。
- `command-builder` 扩展:按引擎规则追加量化 flag。
- 第 5 步精度胶囊行 + `page.tsx` 状态提升,切换实时重算命令与资源行。
- 单测覆盖解析层、能力表完整性、UI 切换。

### 2.2 Out of Scope(留后续)

- 全量实测变体数据(本 PR 只填少量高价值手写覆盖,其余计算推导)。
- 按量化精度自动换 image tag 的映射表(默认沿用 base image)。
- 矩阵 / 配方库总览视图(spec 标记的 P5)。
- i18n 英文化。
- 任何后端 / 真实压测接入。

---

## 3. 架构与模块边界

全部纯静态、纯函数,延续现有「`recipes/*` 数据 + 薄计算层」边界。

```
web/src/
├── lib/
│   ├── recipes/
│   │   ├── types.ts          # 改:上移 Precision;新增 QuantVariant;EngineRecipe.variants?
│   │   └── quant-support.ts   # 新:QUANT_SUPPORT 引擎能力表(纯数据)
│   ├── quant-resolver.ts      # 新:resolveVariant(recipe, engineId, precision) 纯函数
│   ├── command-builder.ts     # 改:BuildOpts 加 quantization?,按引擎追加量化 flag
│   └── fit-advisor.ts         # 改:import Precision 自 types,删本地定义
├── components/
│   ├── RecipeCard.tsx         # 改:顶部精度胶囊行;渲染解析后的 command/image/params/notes/resource
│   └── steps/StepRecipe.tsx   # 改:透传 precision 选择与可选精度集
└── app/page.tsx               # 改:precision 状态提升 + 重算 command/fit
```

**模块职责(可独立单测):**

- `quant-support.ts` — `QUANT_SUPPORT: Record<EngineId, Precision[]>`,无副作用纯数据。
- `quant-resolver.ts` — 输入 `(recipe, engineId, precision, { tp? })`,输出 `{ command: string | null; image?: string; params?: RecipeParam[]; resource?: string; notes?: string; computed: boolean }`。纯函数(`tp` 透传给内部 `buildCommand`)。
- `command-builder.ts` — 输入 `(recipe, { tp?, quantization? })`,对未知字段保持原命令不变(降级安全)。
- 可选精度计算(供 UI 渲染胶囊)是 resolver 暴露的辅助纯函数,见 §6。

---

## 4. 数据模型(types.ts)

```ts
// 上移自 fit-advisor.ts(原处删除本地定义,改为 re-export 或直接 import)
export type Precision = "fp16" | "fp8" | "awq" | "gptq" | "gguf";

// 手写覆盖:仅高价值格子填;给出的字段整体替换 base 对应字段
export interface QuantVariant {
  image?: string;
  command?: string;
  params?: RecipeParam[];
  resource?: string;
  notes?: string;
}

export interface EngineRecipe {
  status: RecipeStatus;
  minVersion?: string;
  image?: string;
  command?: string;
  params?: RecipeParam[];
  resource?: string;
  notes?: string;
  docUrl?: string;
  tooltip?: string;
  variants?: Partial<Record<Precision, QuantVariant>>; // 新增
}
```

`fit-advisor.ts` 改为 `import type { Precision } from "@/lib/recipes/types"`,删除其本地 `export type Precision`;`BYTES_PER_PARAM` 保留在 fit-advisor。

---

## 5. 引擎能力表(quant-support.ts)

可选精度 = base `fp16` + 该引擎支持集。**以下为缺省值,由领域知识在数据里最终敲定:**

```ts
export const QUANT_SUPPORT: Record<EngineId, Precision[]> = {
  "vllm":        ["fp16", "fp8", "awq", "gptq"],
  "vllm-ascend": ["fp16", "fp8", "awq", "gptq"],
  "sglang":      ["fp16", "fp8", "awq", "gptq"],
  "tgi":         ["fp16", "awq", "gptq", "fp8"],
  "lmdeploy":    ["fp16", "awq"],
  "trtllm":      ["fp16", "fp8"],
  "mindie":      ["fp16", "fp8"],
  "llamacpp":    ["fp16", "gguf"],
  "tei":         ["fp16"],
  "infinity":    ["fp16"],
  "comfyui":     ["fp16"],
};
```

不变式:`QUANT_SUPPORT` 必须覆盖 `EngineId` 的全部成员,且每个数组首元素为 `"fp16"`。由单测守护(§7)。

---

## 6. 计算层规则

### 6.1 可选精度(UI 渲染胶囊用)

```
availablePrecisions(recipe, engineId):
  base = ["fp16"]                                  # 永远可选
  for p in QUANT_SUPPORT[engineId] (p != fp16):
    if recipe.variants?.[p]  → 可选               # 有手写覆盖
    else if recipe.command   → 可选               # 计算可推导(需有 base 命令)
  返回去重后、按 QUANT_SUPPORT 顺序排列的精度列表
```

命令缺失的格子(如 TRT-LLM 需预编译、仅 `notes`)→ 只剩 `fp16`,不出量化胶囊。

### 6.2 resolveVariant(recipe, engineId, precision, { tp })

1. **precision === "fp16"(base)**:原样返回 recipe 的 `command`(经 `buildCommand` 仅 tp 改写)、`image`/`params`/`resource`/`notes`,`computed=false`。
2. **存在手写 `recipe.variants[precision]`**:用覆盖字段 merge 在 base 上(覆盖优先),`computed=false`。
3. **否则计算推导**:
   - `command = buildCommand(recipe, { tp, quantization: precision })`(§6.3 规则)。
   - `image`:默认沿用 base image(本 PR 不做 tag 映射)。
   - `params`:在 base params 基础上**追加**一条合成解释项(描述新增的量化 flag)。
   - `notes`:在 base notes 后**追加**通用提示「量化命令为按引擎规则推导,非实测,请以官方文档为准」。
   - `resource`:由调用方用 `advise(model.id, gpu, count, precision)` 重算后展示,resolver 不碰资源文本。
   - `computed=true`。

### 6.3 command-builder 量化 flag 规则

`buildCommand(recipe, { tp?, quantization? })`,`quantization` 为 `fp16` 或缺省时不动量化(沿用现 tp 行为):

| 引擎 | 追加/改写规则 |
|---|---|
| vllm / vllm-ascend / sglang | 追加 `--quantization <fmt>`(fp8/awq/gptq);已存在则替换其值 |
| tgi | 追加 `--quantize <fmt>` |
| lmdeploy(awq) | 追加 `--model-format awq --quant-policy 4` |
| llamacpp(gguf) | 不加 flag(量化体现在 GGUF 文件,命令不变) |
| 其它无规则的引擎 | 命令保持不变(降级安全) |

对未知 `(engineId, precision)` 组合一律返回原命令不变。

---

## 7. 向导流程改动(第 5 步)

- `page.tsx` 新增 `precision` 状态,默认 `"fp16"`;当 `model` 或 `engineId` 变更时重置为 `"fp16"`(避免选了不支持的精度)。
- `fit = advise(model.id, gpu, count, precision)`(把 precision 接上)。
- 用 `resolveVariant(recipe, engineId, precision)` 产出展示字段,替代当前直接传 `recipe`/`command`。
- `RecipeCard` 顶部新增一排精度胶囊(单选),复用现有选项卡 hover 上浮 / 选中青色光晕样式;只渲染 `availablePrecisions` 返回的精度;选中态高亮。
- 切换胶囊即时:重写命令块 + 刷新 RecipeCard 内「需要约 X GB / 可用 Y GB / 是否跑得动」资源行(经 §6.3 + advise)。
- 移动端:胶囊行可换行(`flex-wrap`),与 Plan 2 既有断点一致。

---

## 8. 测试 & 验收

**单测:**
- `quant-resolver`:三分支(base 原样 / 手写覆盖优先 / 计算追加 flag+note);命令缺失 recipe → `availablePrecisions` 仅 `["fp16"]`;各引擎 flag 规则快照。
- `quant-support`:`QUANT_SUPPORT` 覆盖全部 `EngineId`;每数组首元素为 `"fp16"`。
- `command-builder`:新增 `quantization` 各引擎用例 + 未知组合不变 + 与既有 tp 改写共存。
- `fit-advisor`:各 `precision` 的 `requiredGB`/`fits` 计算(补充用例)。
- `RecipeCard`(RTL):渲染胶囊行;切换胶囊重写命令文本;`fp16`-only 配方不出多余胶囊。

**验收(对齐 Plan 1/2):**
- `pnpm test` / `pnpm type-check` / `pnpm build` 全绿。
- 第 5 步精度胶囊视觉与深空极光设计对齐;移动端正常换行。
- 切换精度实时更新命令块与资源行;计算推导的变体带「非实测」提示。

---

## 9. 风险与降级

- **推导命令不准**:计算层产出标注「非实测」,且仅对有明确引擎规则的组合改写;未知组合不改命令。高价值格子可逐步用手写 `variants` 覆盖升级为实测配方。
- **能力表与实际不符**:`QUANT_SUPPORT` 缺省值由领域专家在数据里最终敲定,改表即改 UI,不动逻辑。
- **状态不一致**:`precision` 在 model/engine 变更时强制重置,杜绝「选了引擎不支持的精度」。
