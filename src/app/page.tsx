"use client";

import { useEffect, useRef, useState } from "react";
import { Hero } from "@/components/hero";
import { ChannelCard } from "@/components/channel-card";
import { createWorkflow, pollWorkflow } from "@/lib/workflow-client";
import type { ContentCard, Platform, RunPhase } from "@/lib/types";

const PLATFORMS: Platform[] = ["weibo", "xhs", "video"];

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 分钟上限

const PHASE_LABEL: Record<RunPhase, string> = {
  idle: "就绪",
  submitting: "正在提交工作流",
  running: "工作流运行中",
  querying: "正在查询结果",
  parsed: "内容解析完成",
  failed: "运行失败",
};

/** 变体翻页器 */
function Pager({
  index,
  total,
  onChange,
}: {
  index: number;
  total: number;
  onChange: (i: number) => void;
}) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(index - 1)}
        disabled={index === 0}
        aria-label="上一版"
        className="flex h-7 w-7 items-center justify-center rounded-sm border border-rule text-ink transition-colors hover:border-rule-strong disabled:cursor-not-allowed disabled:opacity-30"
      >
        ‹
      </button>
      <span className="font-mono text-xs tracking-wider text-ink-soft">
        第 {index + 1} / {total} 张
      </span>
      <button
        type="button"
        onClick={() => onChange(index + 1)}
        disabled={index === total - 1}
        aria-label="下一版"
        className="flex h-7 w-7 items-center justify-center rounded-sm border border-rule text-ink transition-colors hover:border-rule-strong disabled:cursor-not-allowed disabled:opacity-30"
      >
        ›
      </button>
      <div className="ml-1 flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            aria-label={`第 ${i + 1} 张`}
            aria-current={i === index ? "true" : undefined}
            className={`h-1.5 w-4 rounded-full transition-colors ${i === index ? "bg-brand" : "bg-rule"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [attempt, setAttempt] = useState(0); // 第 N 次查询
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [clampHeight, setClampHeight] = useState<number | undefined>(undefined);
  const [error, setError] = useState<{ msg: string; code?: string } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 卸载 / 重跑前，清理轮询
  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  function fail(msg: string, code?: string) {
    setError({ msg, code });
    setPhase("failed");
  }

  function pollLoop(executeId: string, signal: AbortSignal) {
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    const tick = () => {
      if (signal.aborted) return;
      if (Date.now() > deadline) {
        fail("工作流超时（超过 10 分钟未完成），请稍后在后台重试查询", "TIMEOUT");
        return;
      }
      setAttempt((n) => n + 1);
      setPhase("querying");
      pollWorkflow(executeId, signal)
        .then((res) => {
          if (signal.aborted) return;
          if (!res.ok) return fail(res.msg ?? "查询结果失败", res.code);
          if (res.status === "Success") {
            const parsed = res.cards ?? [];
            if (parsed.length === 0) return fail("工作流已完成，但未解析出内容卡片", "EMPTY");
            setCards(parsed);
            setActiveIdx(0);
            setPhase("parsed");
            return;
          }
          if (res.status === "Fail") return fail("工作流运行失败，请检查工作流配置后重试", "RUN_FAILED");
          setPhase("running"); // 仍在运行，继续等待
          timerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
        })
        .catch(() => {
          if (signal.aborted) return;
          // 网络抖动 / 请求超时：重试查询，不重建任务
          setPhase("running");
          timerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
        });
    };

    tick();
  }

  function run(keyword: string) {
    // 取消上一轮
    abortRef.current?.abort();
    if (timerRef.current) clearTimeout(timerRef.current);
    const controller = new AbortController();
    abortRef.current = controller;

    setCards([]);
    setActiveIdx(0);
    setClampHeight(undefined);
    setError(null);
    setAttempt(0);
    setPhase("submitting");

    createWorkflow(keyword, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        if (!res.ok || !res.executeId) return fail(res.msg ?? "提交工作流失败", res.code);
        setPhase("running");
        pollLoop(res.executeId, controller.signal);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        fail(err instanceof Error ? err.message : String(err));
      });
  }

  const active = cards[activeIdx];
  const working = phase === "submitting" || phase === "running" || phase === "querying";

  return (
    <main className="min-h-screen">
      <Hero onRun={run} isBusy={working} />

      {/* 运行状态面板 */}
      {phase !== "idle" && (
        <section className="mx-auto w-full max-w-6xl px-6 pb-8">
          <div className="rounded-md border border-rule bg-card px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-newsprint">
              <span>工作流 / WORKFLOW</span>
              {working && <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />}
            </div>
            <div className="mt-3 flex items-center gap-3 font-serif text-base text-ink">
              <span className={phase === "failed" ? "text-danger" : "text-brand"}>
                {PHASE_LABEL[phase]}
              </span>
              {phase !== "failed" && (
                <span className="font-mono text-xs text-newsprint">
                  {phase === "submitting"
                    ? "已向扣子提交异步任务…"
                    : phase === "parsed"
                      ? `共解析 ${cards.length} 张内容卡片`
                      : `第 ${attempt} 次查询 · 每 ${POLL_INTERVAL_MS / 1000}s 一次`}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {error && (
        <section className="mx-auto w-full max-w-6xl px-6 pb-8">
          <div className="rounded-md border border-danger/40 bg-danger/5 px-5 py-3">
            <p className="font-mono text-xs tracking-wider text-danger">运行失败 · {error.code ?? "ERROR"}</p>
            <p className="mt-1 font-serif text-sm text-danger">{error.msg}</p>
          </div>
        </section>
      )}

      {/* 内容卡片区 */}
      {active && (
        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <div className="mb-6 flex items-baseline gap-4 border-t border-rule pt-6">
            <h2 className="font-serif text-xl font-bold text-ink">内容卡片</h2>
            <span className="font-mono text-xs tracking-[0.25em] text-newsprint">CONTENT CARDS</span>
            <span className="font-mono text-xs text-success">已就绪 · 共 {cards.length} 张</span>
            <div className="ml-auto">
              <Pager index={activeIdx} total={cards.length} onChange={(i) => setActiveIdx(i)} />
            </div>
          </div>

          {/* 新闻头 + 审核清单 */}
          <div className="mb-6 rounded-md border border-rule bg-card px-6 py-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] tracking-[0.2em] text-newsprint">NEWS · 卡片 {String(activeIdx + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 font-serif text-2xl font-bold leading-tight text-ink">{active.title}</h3>
                {active.link && (
                  <a
                    href={active.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block max-w-full truncate font-mono text-xs text-brand-ink underline decoration-rule underline-offset-2 hover:decoration-brand"
                  >
                    {active.link}
                  </a>
                )}
              </div>
              {active.review.length > 0 && (
                <div className="shrink-0 border-l border-rule pl-5">
                  <p className="font-mono text-[11px] tracking-wider text-newsprint">统一审核清单</p>
                  <ol className="mt-2 space-y-1">
                    {active.review.map((r, i) => (
                      <li key={i} className="flex gap-2 font-serif text-sm text-ink-soft">
                        <span className="shrink-0 font-mono text-xs text-newsprint">{i + 1}.</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>

          {/* 三渠道 */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PLATFORMS.map((p) => (
              <ChannelCard
                key={p}
                platform={p}
                card={active}
                variantIndex={activeIdx}
                variantTotal={cards.length}
                onBodyHeight={p === "weibo" ? setClampHeight : undefined}
                clampBodyHeight={
                  p !== "weibo" && active.weibo.status === "recommended" ? clampHeight : undefined
                }
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
