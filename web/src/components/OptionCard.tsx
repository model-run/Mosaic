import type { ReactNode } from "react";

interface OptionCardProps {
  title: string;
  icon?: ReactNode;
  desc?: ReactNode;
  badge?: ReactNode;
  selected?: boolean;
  onClick: () => void;
}

export function OptionCard({ title, icon, desc, badge, selected, onClick }: OptionCardProps) {
  return (
    <button type="button" onClick={onClick} className={`option-card ${selected ? "is-selected" : ""}`}>
      {icon && <div className="option-ico">{icon}</div>}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
        {badge}
      </div>
      {desc && <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{desc}</p>}
    </button>
  );
}
