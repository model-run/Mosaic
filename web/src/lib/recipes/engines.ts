import type { EngineMeta } from "./types";

export const ENGINES: EngineMeta[] = [
  { id: "vllm", name: "vLLM", vendor: "UC Berkeley" },
  { id: "vllm-ascend", name: "vLLM-Ascend", vendor: "Huawei Ascend × vLLM" },
  { id: "sglang", name: "SGLang", vendor: "LMSYS" },
  { id: "trtllm", name: "TensorRT-LLM", vendor: "NVIDIA" },
  { id: "mindie", name: "MindIE", vendor: "Huawei Ascend" },
  { id: "lmdeploy", name: "LMDeploy", vendor: "InternLM" },
  { id: "tgi", name: "TGI", vendor: "HuggingFace" },
  { id: "tei", name: "TEI", vendor: "HuggingFace" },
  { id: "infinity", name: "Infinity", vendor: "Michael Feil" },
  { id: "llamacpp", name: "llama.cpp", vendor: "ggml.ai" },
  { id: "comfyui", name: "ComfyUI / Diffusers", vendor: "comfyanonymous · HF" },
];
