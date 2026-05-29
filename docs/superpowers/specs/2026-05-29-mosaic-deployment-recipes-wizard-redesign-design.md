# Mosaic 接入 Deployment Recipes + 全屏深空极光重构 — 设计

**Status:** Approved · 2026-05-29
**Author:** weetime (with Claude)
**Driver:** 将 modeldoctor 的 `deployment-recipes` 配方数据全量迁入 Mosaic(迁入后将从 modeldoctor 删除该 feature),把 Mosaic 从"拼假命令的向导"升级为"基于实测配方、复制即可跑的场景化部署助手",并将 UI 重做为高端 AI 风格(全屏深空极光)。

---

## 1. Why

### 1.1 现状问题(Mosaic)

当前 Mosaic(ModelRun.io)是纯静态前端(Next.js 14 → `docs/` → GitHub Pages),核心逻辑仅 4 个文件:

- `lib/model-data.ts`(12 模型,停留在 2023:LLaMA/ChatGLM-6B/Qwen-7B/SD2.1)
- `lib/gpu-data.ts`(10 张 NVIDIA 卡)
- `lib/engine-data.ts`(4 引擎:vLLM/TRT-LLM/Transformers/Ollama)
- `lib/command-generator.ts`(`switch(engine.id)` 运行时拼字符串)

主要缺陷:

1. **模型数据严重过时**,无 Qwen3 / DeepSeek-V3/R1 / Llama 4 / MoE / VLM / Embedding / Rerank / Diffusion。
2. **生成的命令跑不起来**:`--model ${modelPath}/${model.id}`(`model.id` 是 `llama-7b` 而非 HF repo 名),还塞了 `-v /tmp/.X11-unix` 等无关挂载。
3. **数据靠 `switch` 硬拼**,加引擎要改逻辑;模型只有一个 `minMemory`,无真实镜像 tag / 启动参数 / 已知坑。
4. 视野局限单机 docker run + NVIDIA 消费卡。

### 1.2 可借鉴的成熟范式(modeldoctor)

modeldoctor 的 `apps/web/src/features/deployment-recipes/` 是一张「模型 × 引擎」兼容矩阵 + 每格一份可落地配方,成熟度高一个数量级:

- 数据模型分级 `RecipeStatus = native | partial | community | none`;6 大类 `CategoryId = dense | moe | vlm | embedding | rerank | diffusion`。
- 每个「模型×引擎」存真实 `image`(带版本号)、完整 `command`、逐条 `params{key,value,desc}`、`resource`、`notes`(已知坑)、`docUrl`、`status`。
- 覆盖 11 引擎、~35 个当代模型(含 KV cache 实战配方)。

**结论:数据即真相,由领域知识维护,前端只负责渲染。**

---

## 2. 决策与范围

### 2.1 已拍板决策

| 决策点 | 选择 |
|---|---|
| 产品形态 | **保留向导**(不做矩阵浏览器) |
| 向导流程 | **场景/类别为首步**:场景 → 模型 → 引擎 → GPU 校验 → 配方命令 |
| 语言 | **仅中文(zh-CN)**,与 modeldoctor V1 一致 |
| 视觉方向 | **A · 深空极光 + 全屏沉浸式布局**(full-bleed,占满视口) |
| 数据架构 | **方案 1**:原样移植配方数据 + 薄的纯计算"适配层"(GPU/量化不入配方) |
| 部署形态 | **保持纯静态**(Next.js static export → `docs/` → GitHub Pages,零后端) |

### 2.2 In Scope

- 全量移植 modeldoctor 配方数据(types / engines / ~35 模型)到 Mosaic,内联掉 `@modeldoctor/contracts` 的 `EngineId`。
- 新增场景映射、GPU 适配计算、命令改写三个纯逻辑模块。
- 五步向导状态机。
- 全屏深空极光设计系统 + 五步页面视觉。
- 完整配方命令卡(参数解释 / 已知坑 / status 徽章 / docUrl / 一键复制)。

### 2.3 Out of Scope(挂 §7 后续)

- 量化变体矩阵(方案 3):每个模型×引擎挂 FP16/FP8/AWQ 多变体 — 视反馈再做(Pn)。
- 矩阵/配方库总览视图 — P5 可选。
- i18n 英文化。
- 任何后端 / 真实压测接入(modeldoctor 的 benchmark 能力不迁入)。

---

## 3. 架构与数据模型

保持纯静态。目标结构:

```
web/src/
├── lib/
│   ├── recipes/
│   │   ├── types.ts          # 移植:RecipeStatus / CategoryId / EngineRecipe / ModelEntry / EngineMeta
│   │   │                     #   内联 EngineId 联合类型(去掉 @modeldoctor/contracts 依赖)
│   │   ├── engines.ts        # 11 引擎元数据
│   │   ├── data.ts           # ~35 模型配方(全量移植,zh-CN)
│   │   └── scenarios.ts      # 【新】场景 → category + 模型筛选 的映射
│   ├── gpu-data.ts           # 扩充 GPU 清单(加昇腾 910B 等)
│   ├── fit-advisor.ts        # 【新】纯计算:显存校验 / TP 推荐 / 量化建议
│   └── command-builder.ts    # 【新】基于 recipe + GPU + 量化做轻量命令改写
├── components/               # 向导各步骤 + 命令卡 + 设计系统组件
└── app/                      # 单页向导
```

**核心类型(对齐 modeldoctor):**

```ts
type RecipeStatus = "native" | "partial" | "community" | "none";
type CategoryId = "dense" | "moe" | "vlm" | "embedding" | "rerank" | "diffusion";
type EngineId = "vllm" | "vllm-ascend" | "sglang" | "trtllm" | "mindie"
              | "lmdeploy" | "tgi" | "tei" | "infinity" | "llamacpp" | "comfyui";

interface RecipeParam { key: string; value: string; desc: string }
interface EngineRecipe {
  status: RecipeStatus; minVersion?: string; image?: string; command?: string;
  params?: RecipeParam[]; resource?: string; notes?: string; docUrl?: string; tooltip?: string;
}
interface ModelEntry {
  id: string; name: string; category: CategoryId; meta: string;
  engines: Partial<Record<EngineId, EngineRecipe>>;
}
```

**移除:** 旧 `lib/model-data.ts`、`lib/engine-data.ts`、`lib/command-generator.ts`(及其消费方)。

### 3.1 模块边界

- `recipes/*` — 纯静态数据,无副作用,可独立单测(快照)。
- `scenarios.ts` — 输入场景 id,输出该场景下的 `ModelEntry[]`。纯函数。
- `fit-advisor.ts` — 输入 `(ModelEntry, GPUInfo, count)`,输出 `{ fits: boolean; recommendedTP: number; suggestQuantization?: string; resourceNote: string }`。纯函数,不碰命令文本。
- `command-builder.ts` — 输入 `(EngineRecipe, { tp?, quantization? })`,输出改写后的命令字符串。对未知字段保持原命令不变(降级安全)。

---

## 4. 向导流程

状态机:`① 场景 → ② 模型 → ③ 引擎 → ④ GPU 校验 → ⑤ 配方命令`,可前后跳转,选择持有于单页内存状态(无需路由/持久化)。

1. **① 场景** — 六宫格(对话/助手、RAG/检索、多模态/视觉、图像生成、MoE 大模型、向量/重排)→ 映射到 `CategoryId`。
2. **② 模型** — 按场景过滤的模型卡,显示 `name` / `meta` / category 徽章。
3. **③ 引擎** — 仅列该模型 `engines` 中存在的引擎;用 `status` 徽章标注 native/partial/community;`none` 灰显。
4. **④ GPU 校验** — 选 GPU + 显存 + 卡数,`fit-advisor` 实时给出:是否跑得动、推荐 TP、是否建议量化、命中的 `resource` 文案。
5. **⑤ 配方命令** — 渲染 `command-builder` 产出的完整命令 + `params` 逐条解释 + `notes` 已知坑 + `docUrl` + 一键复制。

**降级:** 若某 recipe 无 `command`(仅 `notes`,如 TRT-LLM 需预编译),第 5 步展示 `notes` + `docUrl`,不强造命令。

---

## 5. UI 设计(全屏深空极光)

- **背景**:全视口多焦点极光渐变(紫 `#7c3aed` / 青 `#22d3ee` / 靛 `#4f46e5`)+ 极细噪点叠加。固定定位,内容层 `z-index` 之上。
- **Hero**:全屏首屏,渐变描边大标题(~64px,移动端缩放),能力胶囊(覆盖模型/引擎数)。
- **向导卡**:玻璃拟态(`background: rgba(255,255,255,.045)` + `backdrop-filter: blur(20px)` + 柔光投影),顶部步骤条。
- **选项卡**:hover 上浮 + 发光;选中态青色描边 + 光晕。
- **命令卡**:深色代码块,关键参数高亮(青/黄),渐变复制按钮(复制后短暂反馈)。
- **字体**:正文系统无衬线("PingFang SC" fallback);命令/参数等宽。
- **响应式**:桌面三列网格,移动端单列;hero 字号与间距随断点收缩。
- 设计系统集中在一处(CSS 变量/Tailwind token),供各步骤复用。

参考高保真预览:`.superpowers/brainstorm/.../fullscreen-hero.html`(本次 brainstorm 产物)。

---

## 6. 路线图(P0→Pn)

| 阶段 | 目标 | 内容 | 验收 |
|---|---|---|---|
| **P0** | 数据底座 | 移植 `recipes/types.ts`、`engines.ts`、`data.ts`(全量 ~35 模型);内联 `EngineId`;删旧 model/engine-data。**不动 UI**。 | 类型通过;数据快照单测;`pnpm build` 不报错 |
| **P1** | 向导骨架 | 新建 `scenarios.ts` + `fit-advisor.ts` + `command-builder.ts`;实现五步状态机(朴素样式跑通逻辑) | 五步可走通;`fit-advisor`/`command-builder` 有单测 |
| **P2** | 全屏极光 UI | 落地深空极光设计系统(背景/玻璃卡/步骤条/hero)+ 五步视觉;响应式 | 视觉对齐预览;移动端单列正常 |
| **P3** | 命令卡打磨 | 完整配方渲染(参数解释/已知坑/status 徽章/docUrl)+ 一键复制 + 语法高亮;降级处理无 command 的 recipe | 复制可用;无 command 走降级 |
| **P4** | GPU/量化增强 | 扩充 GPU 清单(含昇腾);`fit-advisor` 量化建议(FP8/AWQ/GGUF);命令注入量化 flag | 量化建议正确;命令改写有单测 |
| **P5** | 完善与上线 | (可选)配方库总览页;SEO/OG;GitHub Actions 部署校验;README/allaboutproject 更新 | 部署流水线绿;文档更新 |
| **Pn** | 量化变体 | 升级"方案 3":每个模型×引擎挂 FP16/FP8/AWQ 变体 | 视使用反馈决定 |

---

## 7. 风险与注意

- **modeldoctor 数据迁移完整性**:`data.ts` 含对 `@modeldoctor/contracts` 的 `EngineId` 引用,迁入时必须内联;`HF_VOL` 等常量同步搬。迁完做一次 diff 核对模型/引擎数量。
- **命令改写降级**:`command-builder` 对未识别参数/无 command 的 recipe 必须保持原样,不得产出半成品命令。
- **GitHub Pages 路径**:沿用现有 `_next → assets` 重写流程(Makefile `build`),新页面资源路径不破坏。
- **spec 发布**:本 spec 位于 `docs/superpowers/`,会随 GitHub Pages 发布(可 web 访问);如不希望公开,后续可在 `_config.yml` 排除。
- **不迁入 benchmark**:仅迁 deployment-recipes 数据与展示,modeldoctor 的压测/驱动能力不在范围。
