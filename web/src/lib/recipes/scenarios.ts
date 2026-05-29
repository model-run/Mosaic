import type { CategoryId, ModelEntry } from "./types";
import { MODELS } from "./data";

export type ScenarioId =
  | "chat" | "rag" | "multimodal" | "diffusion" | "moe" | "embedding";

export interface Scenario {
  id: ScenarioId;
  label: string;
  icon: string;
  desc: string;
  categories: CategoryId[];
}

export const SCENARIOS: Scenario[] = [
  { id: "chat", label: "对话 / 助手", icon: "💬", desc: "通用聊天、指令遵循、Agent。稠密 LLM 为主。", categories: ["dense"] },
  { id: "rag", label: "RAG / 检索增强", icon: "📚", desc: "长上下文 LLM + 向量 + 重排组合。", categories: ["dense", "embedding", "rerank"] },
  { id: "multimodal", label: "多模态 / 视觉", icon: "🖼️", desc: "图文理解、文档解析。VLM 模型。", categories: ["vlm"] },
  { id: "diffusion", label: "图像生成", icon: "🎨", desc: "SDXL / FLUX / Qwen-Image 等扩散模型。", categories: ["diffusion"] },
  { id: "moe", label: "MoE 大模型", icon: "🧮", desc: "DeepSeek-V3 / Qwen3-MoE，极致性价比。", categories: ["moe"] },
  { id: "embedding", label: "向量 / 重排", icon: "🔢", desc: "BGE-M3 / Qwen3-Embedding / Reranker。", categories: ["embedding", "rerank"] },
];

export function getModelsForScenario(id: ScenarioId): ModelEntry[] {
  const scenario = SCENARIOS.find((s) => s.id === id);
  if (!scenario) return [];
  return MODELS.filter((m) => scenario.categories.includes(m.category));
}
