# 热点内容编辑室

一个关键词，拆成三种分发。输入热点关键词，扣子（Coze）异步工作流搜热点、配商品、写文案，产出
**微博 / 小红书 / 短视频** 三套内容包，编辑在页面上逐条审阅后，自行决定发不发、去哪生成素材。

> ⚠️ **本项目为演示版本，当前默认使用 Mock 模拟数据，未接入真实 API。如需接入真实数据，请参考 `.env.example` 配置。**

- 技术栈：Next.js 16（App Router）+ React 19 + TypeScript 5 + Tailwind CSS 4 + pnpm
- 产品动线：热点发现 → 扣子工作流生成内容 → 多渠道编辑审阅

---

## 本地运行

```bash
pnpm install
cp .env.example .env.local      # 填入你自己的密钥（.env.local 已被 .gitignore 忽略）
pnpm dev                         # http://localhost:3000
```

校验：

```bash
pnpm ts-check                   # tsc --noEmit
pnpm lint                       # eslint
pnpm build                      # 生产构建
pnpm dlx tsx scripts/parser.test.ts   # 解析器验收测试（8 类输入结构）
```

---

## 环境变量

所有密钥只在**服务端**读取（`src/lib/coze.ts` / `src/lib/config.ts`），绝不进入前端代码、浏览器或 Git。

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `APP_COZE_API_TOKEN` | 扣子工作流访问令牌（App 级 PAT），仅服务端；兼容旧名 `COZE_API_TOKEN` | 无 |
| `COZE_WORKFLOW_ID` | 扣子工作流 ID | 无 |
| `COZE_BASE_URL` | 扣子 API 地址（按账号区域） | `https://api.coze.cn` |
| `COZE_WORKFLOW_INPUT_KEY` | 工作流入参中「关键词」的字段名 | `keyword` |
| `COZE_USE_MOCK` | `false` 且令牌/工作流 ID 齐全 → 真实调用；否则一律 Mock | `true`（Mock） |

> 运行模式判定集中在 `src/lib/config.ts` 的 `isMockMode()`：**未配置任何密钥时自动降级到 Mock，不报错**。`.env.example` 是**可提交模板**（不含真实密钥）；真实值只写进 `.env.local`。

---

## 扣子工作流调用方式（异步两步）

1. **创建任务** `POST /v1/workflow/run`
   `{ "workflow_id": "...", "is_async": true, "parameters": { "<inputKey>": "<关键词>" } }`
   请求头 `Authorization: Bearer ${APP_COZE_API_TOKEN}`，返回 `execute_id` 给浏览器。
2. **轮询结果** `GET /v1/workflows/{workflow_id}/run_histories/{execute_id}`，每 5 秒一次、上限 10 分钟。
   状态 `Running / Success / Fail`；`Success` 后读取 `data[0].output` 交给解析器。

**工作流输入参数配置位置**：`src/lib/coze.ts` 的 `INPUT_KEY()`，对应环境变量 `COZE_WORKFLOW_INPUT_KEY`。
如果你的工作流入参字段不叫 `keyword`，改这个环境变量即可，无需动代码。

错误码映射（不泄露密钥 / 完整第三方错误）：

| 场景 | code | 提示 |
| --- | --- | --- |
| 401 / 403 | `AUTH` | 令牌无效或未授权 |
| 429 | `RATE_LIMIT` | 请求频率受限，请稍后再试 |
| 请求超时 | `TIMEOUT` | 请求超时，可重新查询 |
| 网络异常 | `NETWORK` | 网络异常，请稍后重试 |
| 空输出 | `EMPTY` | 工作流返回空内容 |
| 解析失败 | `PARSE_ERROR` | 工作流输出解析失败 |

---

## 工作流输出解析

解析器 `src/lib/parse.ts` 递归解包多层 JSON（`output` / `Output` / `outputList` / `result` / `results` / `data`），
字段名大小写不敏感，最大深度 8；用 `===== 多平台内容卡片 =====` 哨兵识别有效卡片并去重，避免把外层包装误当成卡片。

每张卡片解析为：`新闻标题 / 新闻链接` + 四个分区（微博发布包、小红书发布包、短视频发布包、统一审核清单）。

推荐 / 跳过判定（**精确匹配**，非子串）：

- 跳过词：`不推荐` / `skip` / `skipped` / `跳过`（取「推荐决策」冒号或逗号后的**第一个词**做精确匹配，`推荐` 不会误命中 `不推荐`）。
- 小红书无内容：`封面文案` 与 `正文` 同时为空。
- 短视频无内容：`完整口播稿` 与 `分镜脚本` 同时为空。
- `无 / none / -` 等占位符一律按空处理。

---

## 配图提示词

小红书每一条「配图建议」都带一个**复制提示词**按钮，复制时会自动拼接统一风格后缀：

```
竖版 3:4- 编辑杂志感构图- 自然光- 高清- 色彩克制- 不生成无关文字- 不伪造品牌标识- 图片中如需文字，优先由前端后期叠加
```

拼接逻辑在 `src/lib/prompt.ts` 的 `buildImagePrompt`，改后缀只动这一处。

---

## 已知限制

- 扣子工作流返回格式需包含「多平台内容卡片」哨兵或 ≥2 个分区标记，否则会被判为解析失败。
- 分镜脚本需为 `<秒段｜画面｜口播｜屏幕字幕｜素材要求>` 格式；其它格式会退化为「整行当镜头」。
- `COZE_USE_MOCK=true` 时工作流返回 3 张离线样例卡片，用于离线跑通链路。
- 扣子令牌的 `COZE_BASE_URL` 区域需与账号一致（国内 `api.coze.cn` / 国际 `api.coze.com`）。
- 本版本**不内置**图片 / 视频生成，配图与分镜只提供文案与「复制提示词」；生成请自行投喂到所选的生成模型。

---

## 部署

1. 在部署平台（Vercel / 自建 Node 服务）配置环境变量；**公开演示可完全不配密钥**（自动走 Mock）。
2. `pnpm build && pnpm start`（或平台自动执行）。
3. 接入真实数据：配好 `APP_COZE_API_TOKEN` + `COZE_WORKFLOW_ID`，并设 `COZE_USE_MOCK=false`；密钥只配在服务端环境变量。
4. 前端右下角圆点会实时显示当前模式：灰点「模拟数据」/ 绿点「真实模式」。
