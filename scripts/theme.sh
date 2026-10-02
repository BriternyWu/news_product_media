#!/usr/bin/env bash
#
# 主题脚本 —— 把 Next.js 项目主题化为「报刊橙 + 商务字体 + 中等圆角 + 干净阴影」
#
# 设计灵魂：午夜新闻编辑室 / 杂志社 × 印刷工坊。
# 视觉像翻一份印刷品，交互像在排版分发；拒绝 SaaS 仪表盘 + 蓝紫渐变的套路。
#
# 用法（与原规格一致）:
#   bash scripts/theme.sh --colors orange --fonts business --radius md --shadow cool
#
# 可选参数:
#   --project-dir <dir>   项目根目录（默认当前目录）
#   --colors    orange    报刊橙（当前唯一预设）
#   --fonts     business  商务字体（衬线标题 + 无衬线正文）
#   --radius    md        中等圆角（6px 基准，全部 < 12px）
#   --shadow    cool      干净阴影
#
# 行为:
#   - 重写 src/app/globals.css（Tailwind 4 用 CSS 变量承载主题，无需 tailwind.config.js）
#   - 若存在 tailwind.config.{js,ts,mjs,cjs}（Tailwind 3 项目），则注入 theme.extend.colors 保持一致
#   - 幂等：可重复运行；结尾打印「被修改的文件」清单
#
set -euo pipefail

# ---------- 参数解析 ----------
PROJECT_DIR="$(pwd)"
COLORS="orange"
FONTS="business"
RADIUS="md"
SHADOW="cool"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir) PROJECT_DIR="$2"; shift 2 ;;
    --colors)      COLORS="$2";   shift 2 ;;
    --fonts)       FONTS="$2";    shift 2 ;;
    --radius)      RADIUS="$2";   shift 2 ;;
    --shadow)      SHADOW="$2";   shift 2 ;;
    --help|-h)
      sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "错误：未知参数 $1（可用 --help 查看用法）" >&2; exit 1 ;;
  esac
done

# 预设校验（当前仅实现 orange/business/md/cool，保留扩展位）
[[ "$COLORS" == "orange" ]]   || { echo "错误：--colors 仅支持 orange" >&2; exit 1; }
[[ "$FONTS"  == "business" ]] || { echo "错误：--fonts 仅支持 business" >&2; exit 1; }
[[ "$RADIUS"  == "md" ]]      || { echo "错误：--radius 仅支持 md" >&2; exit 1; }
[[ "$SHADOW"  == "cool" ]]    || { echo "错误：--shadow 仅支持 cool" >&2; exit 1; }

# ---------- 定位样式文件 ----------
GLOBALS="$PROJECT_DIR/src/app/globals.css"
if [[ ! -f "$GLOBALS" ]]; then
  GLOBALS="$PROJECT_DIR/app/globals.css"   # 兼容非 src 目录布局
fi
if [[ ! -f "$GLOBALS" ]]; then
  echo "错误：找不到 globals.css（找过 src/app 与 app 目录）" >&2
  exit 1
fi

# ---------- 生成主题内容 ----------
cat > "$GLOBALS" <<'CSS_EOF'
@import "tailwindcss";

/* ==========================================================================
   NEWSROOM THEME —— 报刊橙 · 商务字体 · 中等圆角 · 干净阴影
   语义化 Token：组件里只用 var(--xxx)，不硬编码 hex / 不用 Tailwind 原生色盘
   ========================================================================== */

:root {
  /* —— 纸张与墨色（编辑室基底）—— */
  --paper: #f6f1e7;          /* 新闻纸底色 */
  --paper-soft: #efe7d7;     /* 深一档的纸色：分栏 / 压痕 / 次级表面 */
  --ink: #1b1712;            /* 主墨色：近黑暖色 */
  --ink-soft: #4a4238;       /* 次级墨色 */
  --newsprint: #6e6455;      /* 灰阶正文 / 注释 / 弱化文字 */

  /* —— 报刊橙（主强调）—— */
  --brand: #e0532b;          /* 报刊橙 */
  --brand-ink: #b63e1e;      /* 报刊橙·深（hover / active） */
  --brand-soft: #f6ddd0;     /* 报刊橙·浅底（标签 / 高亮 / 选区） */

  /* —— 分隔线与描边 —— */
  --rule: #d8cdbb;           /* 暖米色发丝线 */
  --rule-strong: #b9ab93;    /* 强调描边 */

  /* —— 印章（「本刊跳过」用）—— */
  --stamp-bg: #f0e7d6;       /* 米色底 */
  --stamp-border: #9b9180;   /* 灰色描边 */

  /* —— 状态色 —— */
  --success: #3e7a4e;        /* 就绪 / 已印制（编辑室橡皮章墨绿） */
  --danger: #b3261e;         /* 错误 / 失败 */

  /* —— 圆角基准（中等，派生值全部 < 12px）—— */
  --radius: 6px;

  /* —— shadcn/ui 兼容令牌（映射到上面的语义值）—— */
  --background: var(--paper);
  --foreground: var(--ink);
  --card: #fdfbf5;
  --card-foreground: var(--ink);
  --popover: #fdfbf5;
  --popover-foreground: var(--ink);
  --primary: var(--brand);
  --primary-foreground: #fff9f2;
  --secondary: var(--paper-soft);
  --secondary-foreground: var(--ink-soft);
  --muted: #efe8da;
  --muted-foreground: var(--newsprint);
  --accent: var(--paper-soft);
  --accent-foreground: var(--brand-ink);
  --destructive: var(--danger);
  --destructive-foreground: #fff9f2;
  --border: var(--rule);
  --input: var(--rule-strong);
  --ring: var(--brand);
}

/* Tailwind 4：把语义变量暴露为工具类（bg-brand / text-ink / font-serif / rounded-md / shadow-md …） */
@theme inline {
  /* 纸张与墨色 */
  --color-paper: var(--paper);
  --color-paper-soft: var(--paper-soft);
  --color-ink: var(--ink);
  --color-ink-soft: var(--ink-soft);
  --color-newsprint: var(--newsprint);

  /* 报刊橙 */
  --color-brand: var(--brand);
  --color-brand-ink: var(--brand-ink);
  --color-brand-soft: var(--brand-soft);

  /* 分隔线 */
  --color-rule: var(--rule);
  --color-rule-strong: var(--rule-strong);

  /* 印章 */
  --color-stamp-bg: var(--stamp-bg);
  --color-stamp-border: var(--stamp-border);

  /* 状态 */
  --color-success: var(--success);
  --color-danger: var(--danger);

  /* shadcn/ui 兼容 */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  /* 商务字体：衬线标题 + 无衬线正文 */
  --font-sans: "Helvetica Neue", Helvetica, Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  --font-serif: Georgia, "Times New Roman", "Songti SC", "STSong", "SimSun", serif;
  --font-mono: "SF Mono", ui-monospace, Menlo, Consolas, monospace;

  /* 中等圆角（由 --radius 派生，全部 < 12px） */
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: calc(var(--radius) + 2px);
  --radius-lg: calc(var(--radius) + 4px);

  /* 干净阴影 */
  --shadow-xs: 0 1px 2px rgb(27 23 18 / 0.06);
  --shadow-sm: 0 1px 3px rgb(27 23 18 / 0.08);
  --shadow: 0 1px 3px rgb(27 23 18 / 0.09), 0 1px 2px rgb(27 23 18 / 0.05);
  --shadow-md: 0 3px 8px rgb(27 23 18 / 0.10);
  --shadow-lg: 0 6px 16px rgb(27 23 18 / 0.12);
}

/* 编辑室基底：纸色底 + 暖墨正文 + 商务无衬线 */
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
CSS_EOF

GLOBALS_REL="${GLOBALS#"$PROJECT_DIR"/}"
MODIFIED=("$GLOBALS_REL")
echo "已写入样式: $GLOBALS_REL"

# ---------- Tailwind 3 兼容（存在 tailwind.config.* 时注入 theme.extend.colors）----------
for cfg in tailwind.config.js tailwind.config.ts tailwind.config.cjs tailwind.config.mjs; do
  CFG="$PROJECT_DIR/$cfg"
  if [[ -f "$CFG" ]]; then
    if grep -q "NEWSROOM THEME" "$CFG" 2>/dev/null; then
      echo "跳过 tailwind 配置（已含主题标记）: $cfg"
    else
      echo "发现 Tailwind 3 风格配置，注入 theme.extend.colors —— $cfg"
      cat >> "$CFG" <<'TWC_EOF'

// NEWSROOM THEME —— 与 globals.css 语义 Token 保持一致（Tailwind 3 兼容层）
module.exports.__theme_extend_colors = {
  paper: '#f6f1e7', 'paper-soft': '#efe7d7', ink: '#1b1712',
  'ink-soft': '#4a4238', newsprint: '#6e6455',
  brand: '#e0532b', 'brand-ink': '#b63e1e', 'brand-soft': '#f6ddd0',
  rule: '#d8cdbb', 'rule-strong': '#b9ab93',
  'stamp-bg': '#f0e7d6', 'stamp-border': '#9b9180',
  success: '#3e7a4e', danger: '#b3261e',
};
TWC_EOF
      MODIFIED+=("$cfg")
    fi
  fi
done

# ---------- 收尾报告 ----------
echo ""
echo "════════ 主题已应用 ════════"
echo "预设:  colors=$COLORS · fonts=$FONTS · radius=$RADIUS · shadow=$SHADOW"
echo "被修改的文件:"
for f in "${MODIFIED[@]}"; do
  echo "  - $f"
done
if ! compgen -G "$PROJECT_DIR/tailwind.config.*" > /dev/null 2>&1; then
  echo "  （无 tailwind.config.* —— Tailwind 4 使用 CSS 变量配置，无需该文件）"
fi
echo "════════════════════════════"
