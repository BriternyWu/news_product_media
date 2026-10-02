"use client";

import { useState } from "react";

interface HeroProps {
  onRun: (keyword: string) => void;
  isBusy?: boolean;
}

export function Hero({ onRun, isBusy = false }: HeroProps) {
  const [keyword, setKeyword] = useState("");
  const trimmed = keyword.trim();
  const canRun = trimmed.length > 0 && !isBusy;

  return (
    <header className="mx-auto w-full max-w-3xl px-6 pt-12 pb-16">
      {/* 报头：编辑室署名 */}
      <div className="flex items-end justify-between border-b-2 border-ink pb-3">
        <p className="font-serif text-2xl font-bold tracking-wide text-ink">热点内容编辑室</p>
        <p className="font-mono text-[11px] tracking-[0.2em] text-newsprint">
          NO. 01 · HOTSPOT EDITION
        </p>
      </div>

      {/* 眉标 */}
      <div className="mt-10 flex items-center gap-4">
        <span className="h-px flex-1 bg-rule-strong" />
        <p className="font-mono text-xs tracking-[0.35em] text-brand">
          DISCOVER / COMPOSE / REVIEW
        </p>
        <span className="h-px flex-1 bg-rule-strong" />
      </div>

      {/* 主标 */}
      <h1 className="mt-6 font-serif text-5xl font-bold leading-[1.1] tracking-tight text-ink sm:text-6xl">
        一个关键词，
        <br />
        <span className="text-brand">拆成三种分发</span>
      </h1>

      {/* 仿编辑手记副标 */}
      <p className="mt-6 max-w-xl font-serif text-base italic leading-7 text-newsprint">
        —— 输入关键词，工作流替你搜热点、配商品、写文案，产出微博 / 小红书 / 短视频三套内容包，
        你在编辑部里逐条审阅后，再决定发不发。
      </p>

      {/* 横线下划线输入框 */}
      <div className="mt-12">
        <div className="flex items-baseline justify-between">
          <label htmlFor="keyword" className="font-mono text-xs tracking-[0.2em] text-newsprint">
            关键词 / KEYWORD
          </label>
          <span className="font-mono text-xs text-newsprint">{trimmed.length} 字</span>
        </div>
        <input
          id="keyword"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canRun) onRun(trimmed);
          }}
          placeholder="输入一个热点关键词，例如「咖啡豆」"
          className="mt-3 w-full border-0 border-b border-rule-strong bg-transparent px-0 py-2 font-serif text-lg text-ink placeholder:text-newsprint/70 focus:border-brand focus:outline-none"
        />
      </div>

      {/* 运行按钮 */}
      <div className="mt-10 flex items-center gap-4">
        <button
          type="button"
          onClick={() => onRun(trimmed)}
          disabled={!canRun}
          className="inline-flex items-center gap-2 rounded-md bg-brand px-8 py-3 font-sans text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          运行工作流
          <span aria-hidden className="font-mono text-sm">
            →
          </span>
        </button>
        <span className="font-mono text-xs text-newsprint">
          {isBusy ? "正在运行…" : "异步运行，可稍后查看结果"}
        </span>
      </div>
    </header>
  );
}
