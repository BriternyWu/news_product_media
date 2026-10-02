"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type {
  Platform,
  ContentCard,
  WeiboPackage,
  XhsPackage,
  VideoPackage,
} from "@/lib/types";
import { buildImagePrompt } from "@/lib/prompt";
import { BirdIcon, NoteIcon, PlayIcon } from "./icons";
import { CopyButton } from "./copy-button";

const META: Record<
  Platform,
  {
    name: string;
    subtitle: string;
    Icon: (p: { className?: string }) => React.JSX.Element;
    accent: string; // 图标/强调文字颜色
  }
> = {
  weibo: { name: "微博", subtitle: "机锋文案", Icon: BirdIcon, accent: "text-weibo" },
  xhs: { name: "小红书", subtitle: "种草笔记", Icon: NoteIcon, accent: "text-xhs" },
  video: { name: "短视频", subtitle: "节奏分镜", Icon: PlayIcon, accent: "text-video" },
};

const LABEL = "font-mono text-[11px] tracking-wider text-newsprint";

function StatusStamp({ status }: { status: "recommended" | "skipped" | "empty" }) {
  const map = {
    recommended: { text: "已推荐", cls: "border-success text-success" },
    skipped: { text: "不推荐", cls: "border-danger text-danger" },
    empty: { text: "待重发", cls: "border-newsprint text-newsprint" },
  } as const;
  const { text, cls } = map[status];
  return (
    <span className={`shrink-0 rounded-sm border px-2 py-0.5 font-mono text-[11px] tracking-wider ${cls}`}>
      {text}
    </span>
  );
}

function Field({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className={LABEL}>{label}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ------------------------- 可折叠内容体 ------------------------- */
/* 折叠态高度 = 微博内容高度；内容超出时显示「显示更多」，点击展开全量 */

function CollapsibleBody({ height, children }: { height?: number; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  useLayoutEffect(() => {
    if (!height || !ref.current) {
      setOverflow(false);
      return;
    }
    setOverflow(ref.current.scrollHeight > height + 1);
  }, [height, children]);

  if (!height) return <div>{children}</div>;

  const clamped = !expanded && overflow;

  return (
    <div className="relative">
      <div ref={ref} style={{ maxHeight: clamped ? height : undefined, overflow: "hidden" }}>
        {children}
      </div>
      {overflow && (
        <>
          {clamped && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card via-card/70 to-transparent" />
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={
              clamped
                ? "absolute inset-x-0 bottom-2 mx-auto flex w-max items-center gap-1 rounded-sm border border-rule bg-card/90 px-3 py-1 font-mono text-[11px] tracking-wider text-ink shadow-sm transition-colors hover:border-rule-strong hover:text-brand-ink"
                : "mx-auto mt-3 flex w-max items-center gap-1 rounded-sm border border-rule bg-card px-3 py-1 font-mono text-[11px] tracking-wider text-ink transition-colors hover:border-rule-strong hover:text-brand-ink"
            }
          >
            {expanded ? "收起" : "显示更多"}
          </button>
        </>
      )}
    </div>
  );
}

/* ------------------------- 微博 ------------------------- */

function WeiboBody({ pkg }: { pkg: WeiboPackage }) {
  return (
    <div className="space-y-4 px-5 py-6">
      <div className="flex flex-wrap items-center gap-2">
        {pkg.product && <span className="rounded-sm bg-brand-soft px-2 py-0.5 font-mono text-[11px] text-brand-ink">商品：{pkg.product}</span>}
        {pkg.metric && <span className="rounded-sm bg-paper-soft px-2 py-0.5 font-mono text-[11px] text-ink-soft">{pkg.metric}</span>}
      </div>

      <Field label="微博文案" action={<CopyButton text={pkg.text} />}>
        <p className="font-serif text-[15px] leading-7 text-ink">{pkg.text}</p>
      </Field>

      {pkg.basis && (
        <Field label="商品依据">
          <p className="font-serif text-sm leading-6 text-ink-soft">{pkg.basis}</p>
        </Field>
      )}
      {pkg.reviewNote && (
        <div className="rounded-sm border border-rule bg-paper-soft/60 px-3 py-2">
          <p className={LABEL}>人工审核提醒</p>
          <p className="mt-1 font-serif text-sm italic leading-6 text-ink-soft">{pkg.reviewNote}</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------- 小红书 ------------------------- */

function XhsBody({ pkg }: { pkg: XhsPackage }) {
  return (
    <div className="space-y-4 px-5 py-6">
      {pkg.product && (
        <span className="rounded-sm bg-brand-soft px-2 py-0.5 font-mono text-[11px] text-brand-ink">商品：{pkg.product}</span>
      )}

      {pkg.titles.length > 0 && (
        <Field label={`笔记标题 · ${pkg.titles.length} 条`}>
          <ol className="space-y-1">
            {pkg.titles.map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="shrink-0 font-mono text-xs text-newsprint">{i + 1}.</span>
                <span className="flex-1 font-serif text-sm leading-6 text-ink">{t}</span>
                <CopyButton text={t} />
              </li>
            ))}
          </ol>
        </Field>
      )}

      {pkg.coverCopy && (
        <Field label="封面文案" action={<CopyButton text={pkg.coverCopy} />}>
          <p className="font-serif text-sm italic leading-6 text-ink-soft">{pkg.coverCopy}</p>
        </Field>
      )}

      {pkg.body && (
        <Field label="正文" action={<CopyButton text={pkg.body} />}>
          <p className="whitespace-pre-line font-serif text-sm leading-7 text-ink-soft">{pkg.body}</p>
        </Field>
      )}

      {pkg.imagePrompts.length > 0 && (
        <Field label={`配图建议 · ${pkg.imagePrompts.length} 条`}>
          <ol className="space-y-2">
            {pkg.imagePrompts.map((p, i) => (
              <li key={i} className="flex items-start gap-2 rounded-sm border border-rule bg-paper-soft/50 p-2.5">
                <span className="shrink-0 font-mono text-xs text-newsprint">{i + 1}.</span>
                <span className="flex-1 font-serif text-xs leading-5 text-ink-soft">{p}</span>
                <CopyButton text={buildImagePrompt(p)} label="复制提示词" />
              </li>
            ))}
          </ol>
        </Field>
      )}

      {pkg.tags && <Field label="话题标签"><p className="font-serif text-sm text-xhs">{pkg.tags}</p></Field>}
      {pkg.commentGuide && <Field label="评论区引导"><p className="font-serif text-sm leading-6 text-ink-soft">{pkg.commentGuide}</p></Field>}
      {pkg.factBasis && <Field label="事实依据"><p className="font-serif text-sm leading-6 text-ink-soft">{pkg.factBasis}</p></Field>}
      {pkg.reviewNote && (
        <div className="rounded-sm border border-rule bg-paper-soft/60 px-3 py-2">
          <p className={LABEL}>人工审核提醒</p>
          <p className="mt-1 font-serif text-sm italic leading-6 text-ink-soft">{pkg.reviewNote}</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------- 短视频 ------------------------- */

function VideoBody({ pkg }: { pkg: VideoPackage }) {
  const shots = pkg.shots;
  return (
    <div className="space-y-4 px-5 py-6">
      <div className="flex flex-wrap items-center gap-2">
        {pkg.positioning && <span className="rounded-sm bg-video-soft px-2 py-0.5 font-mono text-[11px] text-video">{pkg.positioning}</span>}
        {pkg.duration && <span className="rounded-sm bg-paper-soft px-2 py-0.5 font-mono text-[11px] text-ink-soft">{pkg.duration}</span>}
        {pkg.product && <span className="rounded-sm bg-brand-soft px-2 py-0.5 font-mono text-[11px] text-brand-ink">商品：{pkg.product}</span>}
      </div>

      {pkg.titles.length > 0 && (
        <Field label={`视频标题 · ${pkg.titles.length} 条`}>
          <ol className="space-y-1">
            {pkg.titles.map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="shrink-0 font-mono text-xs text-newsprint">{i + 1}.</span>
                <span className="flex-1 font-serif text-sm leading-6 text-ink">{t}</span>
                <CopyButton text={t} />
              </li>
            ))}
          </ol>
        </Field>
      )}

      {pkg.hook && (
        <Field label="开场钩子" action={<CopyButton text={pkg.hook} />}>
          <p className="font-serif text-sm italic leading-6 text-ink">{pkg.hook}</p>
        </Field>
      )}

      {shots.length > 0 && (
        <div>
          <p className={LABEL}>分镜脚本 · {shots.length} 镜</p>
          <div className="mt-3 grid grid-cols-1 gap-3">
            {shots.map((s) => (
              <div key={s.index} className="rounded-sm border border-rule bg-paper-soft/40">
                <div className="flex items-center gap-2 px-3 pt-2">
                  <span className="font-mono text-xs font-bold text-video">{s.index}</span>
                  <span className="font-mono text-[10px] text-newsprint">{s.timeRange}</span>
                  <span className="flex-1 truncate font-serif text-xs text-ink-soft">{s.scene || s.voice}</span>
                </div>
                <div className="space-y-1 px-3 pb-3 pt-1">
                  {s.scene && <p className="font-serif text-xs leading-5 text-ink-soft"><span className="text-newsprint">画面：</span>{s.scene}</p>}
                  {s.voice && <p className="font-serif text-xs leading-5 text-ink-soft"><span className="text-newsprint">口播：</span>{s.voice}</p>}
                  {s.subtitle && <p className="font-serif text-xs leading-5 text-ink-soft"><span className="text-newsprint">字幕：</span>{s.subtitle}</p>}
                  {s.material && <p className="font-serif text-xs leading-5 text-ink-soft"><span className="text-newsprint">素材：</span>{s.material}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pkg.script && (
        <Field label="完整口播稿" action={<CopyButton text={pkg.script} />}>
          <p className="whitespace-pre-line font-serif text-sm leading-7 text-ink-soft">{pkg.script}</p>
        </Field>
      )}
      {pkg.publishCopy && (
        <Field label="发布文案" action={<CopyButton text={pkg.publishCopy} />}>
          <p className="font-serif text-sm leading-6 text-ink">{pkg.publishCopy}</p>
        </Field>
      )}
      {pkg.coverCopy && <Field label="封面文案"><p className="font-serif text-sm leading-6 text-ink-soft">{pkg.coverCopy}</p></Field>}
      {pkg.tags && <Field label="话题标签"><p className="font-serif text-sm text-video">{pkg.tags}</p></Field>}
      {pkg.music && <Field label="音乐与节奏建议"><p className="font-serif text-sm leading-6 text-ink-soft">{pkg.music}</p></Field>}
      {pkg.factBasis && <Field label="事实依据"><p className="font-serif text-sm leading-6 text-ink-soft">{pkg.factBasis}</p></Field>}
      {pkg.reviewNote && (
        <div className="rounded-sm border border-rule bg-paper-soft/60 px-3 py-2">
          <p className={LABEL}>人工审核提醒</p>
          <p className="mt-1 font-serif text-sm italic leading-6 text-ink-soft">{pkg.reviewNote}</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------- 跳过区 ------------------------- */

function SkippedBody({ status, reason }: { status: "skipped" | "empty"; reason: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-14 text-center">
      <span className="rotate-[-4deg] rounded-sm border-2 border-stamp-border bg-stamp-bg px-6 py-2 font-serif text-lg font-bold tracking-[0.3em] text-ink-soft">
        {status === "skipped" ? "不推荐" : "待重发"}
      </span>
      {reason && <p className="max-w-xs font-serif text-sm italic leading-6 text-newsprint">{reason}</p>}
    </div>
  );
}

/* ------------------------- 卡片外壳 ------------------------- */

export interface ChannelCardProps {
  platform: Platform;
  card: ContentCard;
  variantIndex: number;
  variantTotal: number;
  /** 微博卡片上报自身内容高度（供其它渠道对齐） */
  onBodyHeight?: (height: number) => void;
  /** 小红书 / 短视频折叠到该高度 */
  clampBodyHeight?: number;
}

export function ChannelCard({
  platform,
  card,
  variantIndex,
  variantTotal,
  onBodyHeight,
  clampBodyHeight,
}: ChannelCardProps) {
  const { name, subtitle, Icon, accent } = META[platform];
  const [showRaw, setShowRaw] = useState(false);
  const bodyWrapRef = useRef<HTMLDivElement>(null);

  // 微博上报自然内容高度（不含被网格拉伸的高度），作为其它渠道的对齐基准
  useLayoutEffect(() => {
    if (platform !== "weibo" || !onBodyHeight) return;
    const el = bodyWrapRef.current;
    if (!el) return;
    const report = () => onBodyHeight(el.scrollHeight);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [platform, onBodyHeight, card.key, variantIndex]);

  const pkg =
    platform === "weibo" ? card.weibo : platform === "xhs" ? card.xhs : card.video;

  let content: React.ReactNode;
  if (pkg.status !== "recommended") {
    content = <SkippedBody status={pkg.status} reason={pkg.reason} />;
  } else if (platform === "weibo") {
    content = (
      <div ref={bodyWrapRef}>
        <WeiboBody pkg={card.weibo} />
      </div>
    );
  } else if (platform === "xhs") {
    content = (
      <CollapsibleBody key={card.key} height={clampBodyHeight}>
        <XhsBody pkg={card.xhs} />
      </CollapsibleBody>
    );
  } else {
    content = (
      <CollapsibleBody key={card.key} height={clampBodyHeight}>
        <VideoBody pkg={card.video} />
      </CollapsibleBody>
    );
  }

  return (
    <article className="flex flex-col rounded-md border border-rule bg-card shadow-sm">
      <header className="flex items-center gap-3 border-b border-rule px-5 py-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center ${accent}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h2 className="font-serif text-lg font-bold leading-tight text-ink">{name}</h2>
          <p className="font-mono text-[11px] tracking-[0.18em] text-newsprint">{subtitle}</p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="font-mono text-[11px] text-newsprint">
            变体 {String(variantIndex + 1).padStart(2, "0")}/{String(variantTotal).padStart(2, "0")}
          </span>
          <StatusStamp status={pkg.status} />
        </div>
      </header>

      <div className="flex flex-1 flex-col">
        {content}
        <div className="flex-1" />
      </div>

      <footer className="border-t border-rule px-5 py-2.5">
        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          className="font-mono text-[11px] tracking-wider text-newsprint transition-colors hover:text-ink"
        >
          {showRaw ? "收起原始文案" : "查看原始文案"}
        </button>
        {showRaw && (
          <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-sm border border-rule bg-paper-soft/40 p-3 font-mono text-[11px] leading-5 text-ink-soft">
            {card.raw}
          </pre>
        )}
      </footer>
    </article>
  );
}
