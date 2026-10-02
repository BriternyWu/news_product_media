// ==========================================================================
// 数据模型 —— 热点发现 → 扣子工作流 → 多渠道审阅 → MiniMax 生成
// ==========================================================================

/** 三个分发渠道 */
export type Platform = "weibo" | "xhs" | "video";

/** 渠道推荐状态：推荐 / 明确不推荐 / 无内容 */
export type RecommendStatus = "recommended" | "skipped" | "empty";

/** 单个分镜 */
export interface Shot {
  index: number;
  timeRange: string; // 时间段，如 "0-3秒"
  scene: string; // 画面
  voice: string; // 口播
  subtitle: string; // 屏幕字幕
  material: string; // 素材要求
}

/** 微博发布包 */
export interface WeiboPackage {
  decision: string; // 原始「推荐决策」
  status: RecommendStatus;
  reason: string; // 不推荐原因
  product: string; // 推荐商品
  basis: string; // 商品依据
  metric: string; // 经营指标
  text: string; // 微博文案
  reviewNote: string; // 人工审核提醒
}

/** 小红书发布包 */
export interface XhsPackage {
  decision: string;
  status: RecommendStatus;
  reason: string;
  product: string; // 推荐商品
  titles: string[]; // 笔记标题（编号列表）
  coverCopy: string; // 封面文案
  body: string; // 正文
  imagePrompts: string[]; // 配图建议（编号列表）
  tags: string; // 话题标签
  commentGuide: string; // 评论区引导
  factBasis: string; // 事实依据
  reviewNote: string; // 人工审核提醒
}

/** 短视频发布包 */
export interface VideoPackage {
  decision: string;
  status: RecommendStatus;
  reason: string;
  product: string; // 推荐商品
  positioning: string; // 视频定位
  duration: string; // 建议时长，如 "45秒"
  titles: string[]; // 视频标题（编号列表）
  hook: string; // 开场钩子
  shots: Shot[]; // 分镜脚本
  script: string; // 完整口播稿
  coverCopy: string; // 封面文案
  publishCopy: string; // 发布文案
  tags: string; // 话题标签
  music: string; // 音乐与节奏建议
  factBasis: string; // 事实依据
  reviewNote: string; // 人工审核提醒
}

/** 一张内容卡片 = 一个内容变体，含三个渠道发布包 + 统一审核清单 */
export interface ContentCard {
  key: string;
  title: string; // 新闻标题
  link: string; // 新闻链接
  raw: string; // 原始卡片文本（供「原始文案查看」）
  weibo: WeiboPackage;
  xhs: XhsPackage;
  video: VideoPackage;
  review: string[]; // 统一审核清单
}

/** 工作流运行阶段（前端展示用） */
export type RunPhase =
  | "idle" // 初始
  | "submitting" // 正在提交工作流
  | "running" // 工作流运行中
  | "querying" // 正在查询结果
  | "parsed" // 内容解析完成
  | "failed"; // 运行失败
