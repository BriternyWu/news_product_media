// 平台徽标 —— 自定义 SVG（单色 currentColor，不用 emoji、不用官方 logo 像素）
// 风格：印刷工坊的版画线条 / 实底剪影

interface IconProps {
  className?: string;
}

/** 微博 —— 鸟 */
export function BirdIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      {/* 身体 */}
      <path d="M12 2.5c3.9 0 6.5 2.5 6.5 5.9 0 2.3-1.2 4.3-3 5.4.2 1.4.4 2.8.2 4-.1 1-.6 1.7-1.5 1.7-1.2 0-1.9-.9-1.8-2.4.1-1.3.5-2.6 1.1-3.9-.5-.2-1-.4-1.5-.7-1.9 1-4 1.5-6.2 1.5-1.2 0-2.4-.1-3.5-.4C4.4 15 6.5 16 9 16c3.9 0 7.5-2.3 7.5-5.6 0-.8-.2-1.5-.6-2.1 1.7.5 2.6 1.5 2.6 2.6 0 2.2-2.8 4-6.4 4s-6.4-1.8-6.4-4c0-1.2.9-2.4 2.8-3.1.2-1.7.9-3.2 2-4.4.3.5.7 1.1 1.3 1.7-.2-.2-.4-.3-.7-.4z" />
      {/* 喙 */}
      <path d="M18.5 6.8l4.2-1-4.2 2.1z" />
      {/* 尾羽 */}
      <path d="M5.8 10L2.5 7.4l3.4 3.9z" />
    </svg>
  );
}

/** 小红书 —— 笔记方块 */
export function NoteIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* 纸页 */}
      <rect x="4" y="3" width="16" height="18" rx="2" />
      {/* 书脊 */}
      <path d="M8.2 3v18" />
      {/* 正文行 */}
      <path d="M12 8h5M12 12h5M12 16h3" />
    </svg>
  );
}

/** 短视频 —— 播放三角 */
export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5.4v13.2a1 1 0 0 0 1.5.86l10.1-6.6a1 1 0 0 0 0-1.72L9.5 4.54A1 1 0 0 0 8 5.4z" />
    </svg>
  );
}
