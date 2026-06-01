"use client";

import { useEffect, useRef, useState } from "react";
import { highlight, type SegmentKind } from "@/lib/highlight";

const KIND_CLASS: Record<SegmentKind, string> = {
  flag: "text-cyan-300",
  value: "text-amber-300",
  cont: "text-slate-600",
  plain: "text-slate-200",
};

export function CommandBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // Clear any pending reset timer when the component unmounts.
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    // No clipboard API (insecure context / unsupported) — don't fake success.
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      /* permission denied — leave the label unchanged */
    }
  };

  return (
    <div className="cmd-block">
      <button type="button" onClick={copy} className="cmd-copy">
        {copied ? "已复制 ✓" : "复制"}
      </button>
      <pre className="cmd-pre">
        {highlight(command).map((seg, i) => (
          <span key={i} className={KIND_CLASS[seg.kind]}>
            {seg.text}
          </span>
        ))}
      </pre>
    </div>
  );
}
