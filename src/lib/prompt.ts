// 配图提示词 —— 小红书「复制提示词」按钮使用，拼出完整可投喂生成模型的提示词。

/** 图片建议后的统一风格后缀（与产品规格逐字一致） */
const IMAGE_STYLE_SUFFIX =
  "竖版 3:4- 编辑杂志感构图- 自然光- 高清- 色彩克制- 不生成无关文字- 不伪造品牌标识- 图片中如需文字，优先由前端后期叠加";

/** 由单条「图片建议」拼出完整图片生成提示词 */
export function buildImagePrompt(imagePrompt: string): string {
  const base = (imagePrompt ?? "").trim();
  return `${base} - ${IMAGE_STYLE_SUFFIX}`;
}
