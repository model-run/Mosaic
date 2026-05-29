// GPU 信息接口
export interface GPUInfo {
  id: string;
  name: string;
  memory: number; // GB
  cudaCapability: string;
  recommendedEngines: string[];
  tier: "entry" | "mid" | "high" | "professional";
}
