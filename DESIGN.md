# DESIGN.md —— 设计系统与视觉规范

> 热点内容编辑室 · 一个关键词，拆成三种分发

## 一、设计系统已落地确认

设计系统三要素（**报刊橙 + 商务字体 + 中等圆角**）已全部落地在
[`src/app/globals.css`](src/app/globals.css)，通过 Tailwind CSS 4 的 `@theme inline` 把 CSS 变量暴露为工具类。
组件里只用语义工具类（`bg-paper` / `text-ink` / `font-serif` / `rounded-md` / `shadow-sm` …），不硬编码 hex。

## 二、色彩（语义变量 → Tailwind 工具类）

| CSS 变量 | 值 | 语义 | Tailwind 工具类 |
| --- | --- | --- | --- |
| `--paper` | `#f6f1e7` | 新闻纸底 | `bg-paper` |
| `--paper-soft` | `#efe7d7` | 深一档纸色 | `bg-paper-soft` |
| `--ink` | `#1b1712` | 主墨色 | `text-ink` |
| `--ink-soft` | `#4a4238` | 次级墨色 | `text-ink-soft` |
| `--newsprint` | `#6e6455` | 弱化文字 | `text-newsprint` |
| `--brand` | `#e0532b` | **报刊橙**（主强调） | `bg-brand` / `text-brand` |
| `--brand-ink` | `#b63e1e` | 报刊橙·深 | `text-brand-ink` |
| `--brand-soft` | `#f6ddd0` | 报刊橙·浅底 | `bg-brand-soft` |
| `--rule` | `#d8cdbb` | 发丝分隔线 | `border-rule` |
| `--rule-strong` | `#b9ab93` | 强调描边 | `border-rule-strong` |
| `--stamp-bg` / `--stamp-border` | `#f0e7d6` / `#9b9180` | 状态印章 | `bg-stamp-bg` / `border-stamp-border` |
| `--success` | `#3e7a4e` | 已推荐 / 真实模式（绿） | `text-success` / `bg-success` |
| `--danger` | `#b3261e` | 不推荐 / 错误 | `text-danger` |
| `--weibo` | `#d43c33` | 微博 · 红 | `text-weibo` |
| `--weibo-soft` | `#f7dedb` | 微博 · 浅红底 | `bg-weibo-soft` |
| `--xhs` | `#e0447c` | 小红书 · 玫红 | `text-xhs` |
| `--xhs-soft` | `#fbdbe8` | 小红书 · 浅玫红底 | `bg-xhs-soft` |
| `--video` | `#e07b00` | 短视频 · 橙 | `text-video` |
| `--video-soft` | `#f8e5d1` | 短视频 · 浅橙底 | `bg-video-soft` |

## 三、字体（商务）

| CSS 变量 | 值 | 用途 | Tailwind 工具类 |
| --- | --- | --- | --- |
| `--font-serif` | `Georgia, "Times New Roman", "Songti SC", "STSong", "SimSun", serif` | 主标 / 正文 | `font-serif` |
| `--font-sans` | `"Helvetica Neue", Helvetica, Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif` | UI 文案 | `font-sans` |
| `--font-mono` | `"SF Mono", ui-monospace, Menlo, Consolas, monospace` | 数字 / 标签 / 状态 | `font-mono` |

## 四、圆角（中等，全部 < 12px）

| CSS 变量 | 值 | Tailwind 工具类 |
| --- | --- | --- |
| `--radius-sm` | `4px` | `rounded-sm` |
| `--radius-md` | `8px` | `rounded-md` |
| `--radius-lg` | `10px` | `rounded-lg` |

## 五、阴影（干净）

| CSS 变量 | 值 | Tailwind 工具类 |
| --- | --- | --- |
| `--shadow-xs` | `0 1px 2px rgb(27 23 18 / .06)` | `shadow-xs` |
| `--shadow-sm` | `0 1px 3px rgb(27 23 18 / .08)` | `shadow-sm` |
| `--shadow` | `0 1px 3px rgb(27 23 18 / .09), 0 1px 2px rgb(27 23 18 / .05)` | `shadow` |
| `--shadow-md` | `0 3px 8px rgb(27 23 18 / .10)` | `shadow-md` |
| `--shadow-lg` | `0 6px 16px rgb(27 23 18 / .12)` | `shadow-lg` |

## 六、平台徽标

自定义单色 SVG（`currentColor`），位于 `src/components/icons.tsx`：

- 微博 → 鸟形 `BirdIcon`
- 小红书 → 笔记方块 `NoteIcon`
- 短视频 → 播放三角 `PlayIcon`

## 七、设计约束（硬规则）

- ❌ 蓝紫渐变、SaaS 科技感
- ❌ 圆角 ≥ 12px 的卡片
- ❌ emoji 平台图标 / 官方 logo 像素
- ❌ 「AI 智能生成 / 一键发布」营销词
- ❌ 硬编码 hex（一律走语义变量）
- ❌ npm / yarn（必须 pnpm）
