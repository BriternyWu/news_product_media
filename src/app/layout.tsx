import type { Metadata } from "next";
import "./globals.css";
import { ModeIndicator } from "@/components/mode-indicator";

export const metadata: Metadata = {
  title: "热点内容编辑室 · 一个关键词，三种分发",
  description:
    "输入关键词，扣子工作流搜热点、配商品、写文案，产出微博 / 小红书 / 短视频三套内容包，审阅后由 MiniMax 生成配图与视频。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className="min-h-screen bg-paper font-sans text-ink antialiased"
        suppressHydrationWarning
      >
        {children}
        <ModeIndicator />
      </body>
    </html>
  );
}
