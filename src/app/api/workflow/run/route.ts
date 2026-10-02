// 工作流异步运行：POST 创建任务（返回 executeId），GET 轮询状态（返回卡片）
import { createWorkflowRun, pollWorkflowRun } from "@/lib/coze";
import { parseWorkflowCards } from "@/lib/parse";
import { MOCK_OUTPUT } from "@/lib/mock";
import { isMockMode } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ok = (data: Record<string, unknown>) => Response.json({ ok: true, ...data });
const fail = (msg: string, code: string, status = 500) =>
  Response.json({ ok: false, msg, code }, { status });

function httpStatusFor(code?: string): number {
  if (code === "AUTH") return 401;
  if (code === "RATE_LIMIT") return 429;
  if (code === "BAD_INPUT") return 400;
  return 500;
}

export async function POST(req: Request) {
  let keyword = "";
  try {
    const body = (await req.json()) as { keyword?: unknown };
    keyword = typeof body?.keyword === "string" ? body.keyword.trim() : "";
  } catch {
    keyword = "";
  }
  if (!keyword) return fail("请输入关键词", "BAD_INPUT", 400);

  // 离线 mock：executeId 内嵌时间戳，供 GET 端推算何时「跑完」
  if (isMockMode()) {
    return ok({ executeId: `mock-${Date.now()}` });
  }

  const r = await createWorkflowRun(keyword);
  if (!r.ok) return fail(r.msg ?? "提交工作流失败", r.code ?? "ERROR", httpStatusFor(r.code));
  return ok({ executeId: r.executeId });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const executeId = url.searchParams.get("executeId") ?? "";
  if (!executeId) return fail("缺少 executeId", "BAD_INPUT", 400);

  if (isMockMode()) {
    const ts = Number(executeId.replace(/^mock-/, ""));
    if (!Number.isFinite(ts)) return fail("无效的 executeId", "BAD_INPUT", 400);
    if (Date.now() - ts > 8000) {
      const cards = parseWorkflowCards(MOCK_OUTPUT);
      return ok({ status: "Success", cards });
    }
    return ok({ status: "Running" });
  }

  const r = await pollWorkflowRun(executeId);
  if (!r.ok) return fail(r.msg ?? "查询失败", r.code ?? "ERROR", httpStatusFor(r.code));
  if (r.status === "Running") return ok({ status: "Running" });
  if (r.status === "Fail") return ok({ status: "Fail", msg: r.msg ?? "工作流运行失败" });

  // Success → 解析输出
  const cards = parseWorkflowCards(r.output);
  if (cards.length === 0) {
    const empty =
      r.output == null || (typeof r.output === "string" && !r.output.trim());
    return fail(empty ? "工作流返回空内容" : "工作流输出解析失败", empty ? "EMPTY" : "PARSE_ERROR", 422);
  }
  return ok({ status: "Success", cards });
}
