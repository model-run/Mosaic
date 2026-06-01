import { ENGINES } from "@/lib/recipes/engines";
import { MODELS } from "@/lib/recipes/data";

export function Hero() {
  return (
    <section className="hero">
      <div className="pill">
        <span className="dot" />
        覆盖 {MODELS.length}+ 模型 · {ENGINES.length} 大推理引擎
      </div>
      <h1 className="gradient-text">
        三分钟生成
        <br />
        可跑的部署命令
      </h1>
      <p className="hero-sub">
        从你的场景出发，自动推荐模型与引擎，产出经过实测、复制即可运行的部署配方。
      </p>
    </section>
  );
}
