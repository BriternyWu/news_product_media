"use client";

import { useEffect, useState } from "react";

interface ModeInfo {
  mode: "mock" | "real";
  reason: string;
}

/** 右下角运行模式小圆点：模拟数据（灰） / 真实模式（绿） */
export function ModeIndicator() {
  const [info, setInfo] = useState<ModeInfo | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/config")
      .then((r) => r.json())
      .then((d: Partial<ModeInfo>) => {
        if (!alive) return;
        setInfo({ mode: d.mode ?? "mock", reason: d.reason ?? "模拟数据" });
      })
      .catch(() => {
        if (!alive) return;
        setInfo({ mode: "mock", reason: "模拟数据" });
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!info) return null;

  const real = info.mode === "real";
  return (
    <aside
      title={info.reason}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-rule bg-card/90 px-3 py-1.5 shadow-sm backdrop-blur-sm"
    >
      <span
        aria-hidden
        className={`h-2 w-2 rounded-full ${real ? "bg-success" : "bg-newsprint"}`}
      />
      <span className="font-mono text-[11px] tracking-wider text-ink-soft">
        {real ? "真实模式" : "模拟数据"}
      </span>
    </aside>
  );
}
