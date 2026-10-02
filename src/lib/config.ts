// ==========================================================================
// 运行时模式判定：真实 / 模拟。
// 公开部署没有任何密钥 → 自动降级到 Mock（不报错、不崩溃）；
// 本地在 .env.local 配置了令牌并显式关闭 Mock → 走真实 API。
// ==========================================================================

function token(): string {
  return process.env.APP_COZE_API_TOKEN ?? process.env.COZE_API_TOKEN ?? "";
}
function workflowId(): string {
  return process.env.COZE_WORKFLOW_ID ?? "";
}

/**
 * 是否走 Mock。规则：
 * - 显式 COZE_USE_MOCK=false 且令牌 + 工作流 ID 齐全 → 真实（false）
 * - 其余一切情况（未设置 / 显式 true / 缺少令牌）→ Mock（true）
 */
export function isMockMode(): boolean {
  if (process.env.COZE_USE_MOCK === "false") {
    return !(token() && workflowId());
  }
  return true;
}

export interface RuntimeMode {
  mode: "mock" | "real";
  reason: string;
}

/** 供前端状态指示器展示的模式与说明 */
export function getMode(): RuntimeMode {
  const hasCreds = Boolean(token() && workflowId());
  if (process.env.COZE_USE_MOCK === "false" && hasCreds) {
    return { mode: "real", reason: "真实模式 · 已接入扣子工作流" };
  }
  if (!hasCreds) {
    return { mode: "mock", reason: "模拟数据 · 未配置令牌，已自动降级" };
  }
  return { mode: "mock", reason: "模拟数据" };
}
