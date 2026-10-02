import { getMode } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 前端状态指示器用：返回当前运行模式（mock / real），不暴露任何密钥
export async function GET() {
  return Response.json({ ok: true, ...getMode() });
}
