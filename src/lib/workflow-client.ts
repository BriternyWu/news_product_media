// 前端工作流客户端 —— 创建异步任务 + 轮询状态（不接触任何密钥）
import type { ContentCard } from "./types";

export interface CreateResp {
  ok: boolean;
  executeId?: string;
  msg?: string;
  code?: string;
}

export interface PollResp {
  ok: boolean;
  status?: "Running" | "Success" | "Fail";
  cards?: ContentCard[];
  msg?: string;
  code?: string;
}

async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  return (await res.json()) as T;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  return (await res.json()) as T;
}

export function createWorkflow(keyword: string, signal?: AbortSignal): Promise<CreateResp> {
  return postJson<CreateResp>("/api/workflow/run", { keyword }, signal);
}

export function pollWorkflow(executeId: string, signal?: AbortSignal): Promise<PollResp> {
  return getJson<PollResp>(
    `/api/workflow/run?executeId=${encodeURIComponent(executeId)}`,
    signal
  );
}
