// ==========================================================================
// 扣子异步工作流 —— 仅服务端调用，密钥绝不下发前端。
// 第一步 POST /v1/workflow/run（is_async:true）拿到 execute_id；
// 第二步 GET /v1/workflows/{id}/run_histories/{execute_id} 轮询状态。
// ==========================================================================

const BASE_URL = () => process.env.COZE_BASE_URL ?? "https://api.coze.cn";
const TOKEN = () => process.env.APP_COZE_API_TOKEN ?? process.env.COZE_API_TOKEN ?? "";
const WORKFLOW_ID = () => process.env.COZE_WORKFLOW_ID ?? "";
const INPUT_KEY = () => process.env.COZE_WORKFLOW_INPUT_KEY ?? "keyword";

export type CozeExecuteStatus = "Running" | "Success" | "Fail" | "Unknown";

export interface CreateResult {
  ok: boolean;
  executeId?: string;
  msg?: string;
  code?: string;
}

export interface PollResult {
  ok: boolean;
  status?: CozeExecuteStatus;
  output?: unknown;
  msg?: string;
  code?: string;
}

function missingConfig(): string[] {
  const missing: string[] = [];
  if (!TOKEN()) missing.push("APP_COZE_API_TOKEN");
  if (!WORKFLOW_ID()) missing.push("COZE_WORKFLOW_ID");
  return missing;
}

/** 带 15s 超时的 fetch，避免挂在第三方长连接上 */
async function cozeFetch(
  path: string,
  init: RequestInit
): Promise<{ status: number; json: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${BASE_URL()}${path}`, { ...init, signal: controller.signal });
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

/** 把 HTTP / Coze 错误码映射成用户可理解的信息，不暴露密钥与原始错误对象 */
function mapError(status: number, json: unknown): { msg: string; code: string } {
  if (status === 401 || status === 403) return { msg: "令牌无效或未授权", code: "AUTH" };
  if (status === 429) return { msg: "请求频率受限，请稍后再试", code: "RATE_LIMIT" };
  const body = (json ?? {}) as { code?: number; msg?: string };
  if (body.code && body.code !== 0) {
    return { msg: body.msg || "工作流调用失败", code: String(body.code) };
  }
  return { msg: `请求失败（HTTP ${status}）`, code: String(status) };
}

function networkError(e: unknown): { msg: string; code: string } {
  if (e instanceof Error && e.name === "AbortError") {
    return { msg: "请求超时，可重新查询", code: "TIMEOUT" };
  }
  return { msg: "网络异常，请稍后重试", code: "NETWORK" };
}

/** 第一步：创建异步工作流任务，返回 execute_id */
export async function createWorkflowRun(keyword: string): Promise<CreateResult> {
  const missing = missingConfig();
  if (missing.length) {
    return { ok: false, msg: `缺少环境变量：${missing.join("、")}`, code: "CONFIG" };
  }

  try {
    const { status, json } = await cozeFetch("/v1/workflow/run", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow_id: WORKFLOW_ID(),
        is_async: true,
        parameters: { [INPUT_KEY()]: keyword },
      }),
    });

    const body = json as { code?: number; data?: unknown } | null;
    if (status !== 200 || !body || body.code !== 0) {
      return { ok: false, ...mapError(status, json) };
    }

    const data = body.data;
    const executeId =
      typeof data === "string"
        ? data
        : ((data as { execute_id?: string; executeId?: string })?.execute_id ??
          (data as { execute_id?: string; executeId?: string })?.executeId);
    if (!executeId) {
      return { ok: false, msg: "未获取到 execute_id", code: "NO_EXECUTE_ID" };
    }
    return { ok: true, executeId };
  } catch (e) {
    return { ok: false, ...networkError(e) };
  }
}

/** 第二步：轮询工作流状态 */
export async function pollWorkflowRun(executeId: string): Promise<PollResult> {
  const missing = missingConfig();
  if (missing.length) {
    return { ok: false, msg: `缺少环境变量：${missing.join("、")}`, code: "CONFIG" };
  }

  try {
    const { status, json } = await cozeFetch(
      `/v1/workflows/${WORKFLOW_ID()}/run_histories/${encodeURIComponent(executeId)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${TOKEN()}` },
      }
    );

    const body = json as { code?: number; data?: unknown } | null;
    if (status !== 200 || !body || body.code !== 0) {
      return { ok: false, ...mapError(status, json) };
    }

    const list = Array.isArray(body.data) ? (body.data as Record<string, unknown>[]) : [];
    const item = list[0] ?? {};
    const st = String(item.execute_status ?? "").toLowerCase();

    if (st === "success") {
      return { ok: true, status: "Success", output: item.output ?? item.error ?? "" };
    }
    if (st === "fail" || st === "failed") {
      return {
        ok: true,
        status: "Fail",
        msg: typeof item.error === "string" && item.error ? item.error : "工作流运行失败",
      };
    }
    return { ok: true, status: "Running" };
  } catch (e) {
    return { ok: false, ...networkError(e) };
  }
}
