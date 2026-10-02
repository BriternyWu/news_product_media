<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 项目架构（热点内容编辑室）

一个关键词，拆成三种分发：输入热点关键词 → 扣子（Coze）异步工作流搜热点、配商品、写文案 →
产出微博 / 小红书 / 短视频三套内容包 → 编辑逐条审阅。

## 技术栈

- Next.js 16.3（App Router，路由处理器用 Web `Request/Response`，`runtime="nodejs"` + `dynamic="force-dynamic"`）
- React 19 + TypeScript 5 + Tailwind CSS 4（`@theme inline` 语义变量）+ pnpm

## 核心文件作用

| 路径 | 作用 |
| --- | --- |
| `src/lib/types.ts` | 数据模型：`ContentCard`、三渠道发布包、`Shot`、`RunPhase` |
| `src/lib/config.ts` | 运行时模式判定：`isMockMode()` / `getMode()`（真实 / 模拟切换唯一入口） |
| `src/lib/coze.ts` | 扣子异步工作流调用（仅服务端）：创建任务 + 轮询 `run_histories` |
| `src/lib/parse.ts` | 递归 JSON 解包（深度 ≤8）+ 哨兵识别卡片 + 精确跳过判定 |
| `src/lib/mock.ts` | 离线样例卡片（3 张，覆盖全推荐 / 小红书跳过 / 短视频跳过） |
| `src/lib/prompt.ts` | 小红书配图「复制提示词」风格后缀拼接 |
| `src/app/api/workflow/run/route.ts` | 工作流代理：`POST` 创建 / `GET` 轮询，统一 `{ok,msg,code}` |
| `src/app/api/config/route.ts` | 返回当前运行模式，供前端状态指示器使用 |
| `src/lib/workflow-client.ts` | 前端工作流客户端（只拿 executeId，不碰密钥） |
| `src/app/page.tsx` | 状态机（submitting/running/querying/parsed/failed）+ 轮询 + 翻页 |
| `src/components/channel-card.tsx` | 三渠道卡片：状态章、复制按钮、折叠（显示更多） |
| `src/components/hero.tsx` / `mode-indicator.tsx` / `copy-button.tsx` | 关键词输入 / 右下角模式圆点 / 复制按钮 |
| `src/app/globals.css` | 设计系统 token（报刊橙、商务字体、中等圆角、三渠道强调色） |

## COZE_USE_MOCK 真实 / 模拟切换逻辑

判定逻辑集中在 `src/lib/config.ts` 的 `isMockMode()`：

- `COZE_USE_MOCK=false` 且 `APP_COZE_API_TOKEN` 与 `COZE_WORKFLOW_ID` 齐全 → **真实模式**；
- 其余一切情况（未设置 / 显式 `true` / 缺少令牌或工作流 ID）→ **Mock 模式**（默认、自动降级、不报错）。

因此：

- **本地**：`.env.local`（gitignore）填真实令牌 + `COZE_USE_MOCK=false` → 真实调用；
- **公开/远程**：不提供 `.env.local`、不配任何密钥 → 自动走 Mock，前端右下角显示「模拟数据」。

密钥只在服务端读取（`coze.ts` / `config.ts`），前端代码、浏览器、Git 均不含任何密钥。
