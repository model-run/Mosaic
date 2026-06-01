export const STEPS = ["场景", "模型", "引擎", "GPU 校验", "配方命令"];

const NUMERALS = ["①", "②", "③", "④", "⑤"];

export function StepBar({ current }: { current: number }) {
  return (
    <ol className="step-bar">
      {STEPS.map((label, i) => (
        <li key={label} className={i === current ? "active" : i < current ? "done" : ""}>
          {NUMERALS[i]} {label}
          {i < STEPS.length - 1 && <span className="sep"> › </span>}
        </li>
      ))}
    </ol>
  );
}
