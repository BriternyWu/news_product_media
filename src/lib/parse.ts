// ==========================================================================
// 工作流输出解析器 —— 把扣子异步工作流的输出解析成 ContentCard[]
// 兼容多层 JSON 包装（output / Output / outputList / data.result.output …），
// 用「===== 多平台内容卡片 =====」识别有效卡片，去重，递归深度上限 8。
// ==========================================================================
import type {
  ContentCard,
  RecommendStatus,
  Shot,
  WeiboPackage,
  XhsPackage,
  VideoPackage,
} from "./types";

export const SENTINEL = "===== 多平台内容卡片 =====";

/** 容器键优先级（字段名大小写不敏感） */
const CONTAINER_KEYS = ["output", "outputlist", "output_list", "result", "results", "data"];
const SECTION_MARKERS = ["微博发布包", "小红书发布包", "短视频发布包"];

/* ------------------------- 决策 / 跳过判定 ------------------------- */

/** 明确跳过词（精确匹配，不用 .includes，避免「推荐」误命中「不推荐」） */
const SKIP_WORDS = new Set(["不推荐", "skip", "skipped", "跳过"]);

/** 占位空值（「无 / none / - …」一律按空处理） */
const EMPTY_RE = /^(无|none|无内容|暂无|n\/a|-)$/i;

export function parseDecision(decision: string): { status: RecommendStatus; reason: string } {
  const d = (decision ?? "").trim();
  if (!d) return { status: "recommended", reason: "" };
  const first = d.split(/[：:,，]/)[0].trim();
  const lower = first.toLowerCase();
  if (SKIP_WORDS.has(first) || SKIP_WORDS.has(lower)) {
    const idx = d.indexOf(first);
    const rest = d.slice(idx + first.length).replace(/^[：:,，\s]+/, "").trim();
    return { status: "skipped", reason: rest };
  }
  return { status: "recommended", reason: "" };
}

/** 结合「推荐决策」与「是否无内容」得出最终渠道状态 */
function resolveStatus(decision: string, isEmpty: boolean): { status: RecommendStatus; reason: string } {
  const d = parseDecision(decision);
  if (d.status === "skipped") return d;
  if (isEmpty) return { status: "empty", reason: "无内容" };
  return { status: "recommended", reason: "" };
}

/* ------------------------- 编号列表 ------------------------- */

/** 按 1./2./3. 切分编号列表（兼容换行或同一行；「无」返回空） */
export function parseNumberedList(text: string): string[] {
  if (!text) return [];
  const items: string[] = [];
  const parts = text.split(/(?=\s*\d+\s*[.、．]\s*)/);
  for (const part of parts) {
    const m = part.match(/^\s*\d+\s*[.、．]\s*([\s\S]*)$/);
    if (m) {
      const it = m[1].trim();
      if (it && !EMPTY_RE.test(it)) items.push(it);
    } else {
      const t = part.trim();
      if (t && !EMPTY_RE.test(t)) items.push(t);
    }
  }
  return items;
}

/* ------------------------- 分镜 ------------------------- */

function parseShotLine(inner: string, index: number): Shot | null {
  const content = inner.replace(/^<|>$/g, "").trim();
  if (!content) return null;
  const parts = content.split(/[｜|]/).map((s) => s.trim()).filter(Boolean);
  const timeRange = parts[0] ?? "";
  const rest = parts.slice(1);
  const field = (labels: string[]): string => {
    for (const p of rest) {
      for (const l of labels) {
        if (p.startsWith(l)) return p.slice(l.length).replace(/^[：:]\s*/, "").trim();
      }
    }
    return "";
  };
  return {
    index,
    timeRange,
    scene: field(["画面"]),
    voice: field(["口播"]),
    subtitle: field(["屏幕字幕", "字幕"]),
    material: field(["素材要求", "素材"]),
  };
}

/** 分镜脚本 → 镜头数组（「无」/空 → []；兼容 <秒段｜画面｜口播｜字幕｜素材> 格式） */
export function parseShots(script: string): Shot[] {
  if (!script || /^(无|none|无内容)$/i.test(script.trim())) return [];
  const blocks = script.match(/<[^>]*>/g) ?? [];
  if (blocks.length > 0) {
    return blocks
      .map((b, i) => parseShotLine(b, i + 1))
      .filter((s): s is Shot => s !== null);
  }
  // 无尖括号的退化格式：每行当一个镜头，整行塞进「画面」
  return script
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => ({
      index: i + 1,
      timeRange: "",
      scene: l,
      voice: "",
      subtitle: "",
      material: "",
    }));
}

/* ------------------------- 递归解包 ------------------------- */

const MAX_DEPTH = 8;

/** 递归收集字符串候选：解包 JSON 字符串、数组、对象（按容器键优先级下钻） */
function collectText(value: unknown, depth: number, out: string[]): void {
  if (depth > MAX_DEPTH || value == null) return;

  if (typeof value === "string") {
    const t = value.trim();
    const looksJson =
      (t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"));
    if (looksJson) {
      try {
        collectText(JSON.parse(t), depth + 1, out);
        return;
      } catch {
        /* 非 JSON，落到下面的原始字符串收集 */
      }
    }
    out.push(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const v of value) collectText(v, depth + 1, out);
    return;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // 按优先级找第一个存在的容器键，只沿它下钻（避免把外层包装当成卡片）
    for (const key of CONTAINER_KEYS) {
      const hit = Object.keys(obj).find((k) => k.toLowerCase() === key);
      if (hit !== undefined) {
        collectText(obj[hit], depth + 1, out);
        return;
      }
    }
    for (const k of Object.keys(obj)) collectText(obj[k], depth + 1, out);
  }
}

function dedup(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const key = it.replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

/** 从任意原始输出提取卡片文本块（已去重） */
export function extractCardBlocks(raw: unknown): string[] {
  const texts: string[] = [];
  collectText(raw, 0, texts);

  const blocks: string[] = [];
  for (const t of texts) {
    if (t.includes(SENTINEL)) {
      for (const part of t.split(SENTINEL)) {
        const p = part.trim();
        if (p) blocks.push(p);
      }
    }
  }

  // 兜底：无哨兵时，含 ≥2 个分区标记的字符串才视为一张卡片
  if (blocks.length === 0) {
    for (const t of texts) {
      const tt = t.trim();
      const count = SECTION_MARKERS.filter((m) => tt.includes(m)).length;
      if (count >= 2) blocks.push(tt);
    }
  }

  return dedup(blocks);
}

/* ------------------------- 章节 / 字段 ------------------------- */

/** 按 ----- 章节名 ----- 切分卡片文本 */
function splitSections(block: string): { header: string; sections: Record<string, string> } {
  const sections: Record<string, string> = {};
  const re = /-{3,}\s*([^-\n]+?)\s*-{3,}/g;
  let header = "";
  let lastName = "";
  let lastPos = -1;
  let match: RegExpExecArray | null;
  let first = true;
  while ((match = re.exec(block)) !== null) {
    if (first) {
      header = block.slice(0, match.index).trim();
      first = false;
    } else if (lastName) {
      sections[lastName] = block.slice(lastPos, match.index).trim();
    }
    lastName = match[1].trim();
    lastPos = match.index + match[0].length;
  }
  if (lastName) sections[lastName] = block.slice(lastPos).trim();
  return { header, sections };
}

/** 章节内「字段名：值」解析（值可跨多行，编号行视为续行而非新键） */
function parseSectionKV(body: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = body.split(/\r?\n/);
  let currentKey: string | null = null;
  let buffer: string[] = [];
  const flush = () => {
    if (currentKey !== null) {
      result[currentKey] = buffer.join("\n").trim();
      currentKey = null;
      buffer = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const isListItem = /^\s*\d+\s*[.、．]/.test(line);
    const kv = line.match(/^\s*([^：:]{1,40})[：:]\s?(.*)$/);
    if (!isListItem && kv) {
      flush();
      currentKey = kv[1].trim();
      buffer = [kv[2].trim()];
    } else if (currentKey !== null) {
      buffer.push(line.trim());
    }
  }
  flush();
  return result;
}

function get(obj: Record<string, string>, key: string): string {
  const raw = obj[key] ?? "";
  return EMPTY_RE.test(raw.trim()) ? "" : raw;
}

function listField(obj: Record<string, string>, key: string): string[] {
  const raw = get(obj, key);
  if (!raw || /^(无|none|无内容)$/i.test(raw.trim())) return [];
  return parseNumberedList(raw);
}

/* ------------------------- 卡片解析 ------------------------- */

function parseWeibo(w: Record<string, string>): WeiboPackage {
  const text = get(w, "微博文案");
  return {
    decision: get(w, "推荐决策"),
    ...resolveStatus(get(w, "推荐决策"), !text),
    product: get(w, "推荐商品"),
    basis: get(w, "商品依据"),
    metric: get(w, "经营指标"),
    text,
    reviewNote: get(w, "人工审核提醒"),
  };
}

function parseXhs(x: Record<string, string>): XhsPackage {
  const coverCopy = get(x, "封面文案");
  const body = get(x, "正文");
  return {
    decision: get(x, "推荐决策"),
    ...resolveStatus(get(x, "推荐决策"), !coverCopy && !body),
    product: get(x, "推荐商品"),
    titles: listField(x, "笔记标题"),
    coverCopy,
    body,
    imagePrompts: listField(x, "配图建议"),
    tags: get(x, "话题标签"),
    commentGuide: get(x, "评论区引导"),
    factBasis: get(x, "事实依据"),
    reviewNote: get(x, "人工审核提醒"),
  };
}

function parseVideo(v: Record<string, string>): VideoPackage {
  const shots = parseShots(get(v, "分镜脚本"));
  const script = get(v, "完整口播稿");
  return {
    decision: get(v, "推荐决策"),
    ...resolveStatus(get(v, "推荐决策"), !script && shots.length === 0),
    product: get(v, "推荐商品"),
    positioning: get(v, "视频定位"),
    duration: get(v, "建议时长"),
    titles: listField(v, "视频标题"),
    hook: get(v, "开场钩子"),
    shots,
    script,
    coverCopy: get(v, "封面文案"),
    publishCopy: get(v, "发布文案"),
    tags: get(v, "话题标签"),
    music: get(v, "音乐与节奏建议"),
    factBasis: get(v, "事实依据"),
    reviewNote: get(v, "人工审核提醒"),
  };
}

function parseCardBlock(block: string, index: number): ContentCard {
  const { header, sections } = splitSections(block);
  const head = parseSectionKV(header);
  const weiboRaw = sections["微博发布包"] ?? "";
  const xhsRaw = sections["小红书发布包"] ?? "";
  const videoRaw = sections["短视频发布包"] ?? "";
  const reviewRaw = sections["统一审核清单"] ?? "";

  const reviewList = parseNumberedList(reviewRaw);
  const review = reviewList.length ? reviewList : reviewRaw.trim() ? [reviewRaw.trim()] : [];

  return {
    key: `card-${index + 1}`,
    title: get(head, "新闻标题"),
    link: get(head, "新闻链接"),
    raw: block,
    weibo: parseWeibo(parseSectionKV(weiboRaw)),
    xhs: parseXhs(parseSectionKV(xhsRaw)),
    video: parseVideo(parseSectionKV(videoRaw)),
    review,
  };
}

/** 把扣子原始输出（多层 JSON / 数组 / 字符串）解析为 ContentCard[] */
export function parseWorkflowCards(raw: unknown): ContentCard[] {
  const blocks = extractCardBlocks(raw);
  return blocks.map((b, i) => parseCardBlock(b, i));
}
