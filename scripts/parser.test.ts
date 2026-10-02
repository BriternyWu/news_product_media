// 解析器验收测试 —— 覆盖 8 类输入结构（直接数组 / Output 包裹 / outputList /
// 嵌套 data.result.output / 多卡片 / 混合推荐跳过 / 四镜头 / 分镜=无）。
// 运行：pnpm dlx tsx scripts/parser.test.ts
import assert from "node:assert";
import {
  parseWorkflowCards,
  parseDecision,
  parseShots,
  SENTINEL,
} from "../src/lib/parse";

let pass = 0;
function ok(name: string, fn: () => void) {
  fn();
  pass += 1;
  console.log(`  ✓ ${name}`);
}

const W = (extra = "") => `----- 微博发布包 -----\n推荐决策：推荐\n微博文案：微博正文${extra}\n`;
const X = (extra = "") =>
  `----- 小红书发布包 -----\n推荐决策：推荐\n封面文案：封面\n正文：种草正文${extra}\n`;
const V = (extra = "") =>
  `----- 短视频发布包 -----\n推荐决策：推荐\n完整口播稿：口播全文${extra}\n`;
const R = "----- 统一审核清单 -----\n1. 核对价格\n2. 核对来源";

const cardBlock = (head: string, weibo: string, xhs: string, video: string, review = R) =>
  `${SENTINEL}\n${head}\n${weibo}${xhs}${video}${review}`;

const HEAD = "新闻标题：测试新闻\n新闻链接：https://example.com/a";

console.log("解析器验收测试\n");

// 1. 直接输出数组（顶层就是卡片字符串数组）
ok("直接输出数组", () => {
  const cards = parseWorkflowCards([cardBlock(HEAD, W(), X(), V())]);
  assert.strictEqual(cards.length, 1);
  assert.strictEqual(cards[0].weibo.text, "微博正文");
  assert.strictEqual(cards[0].xhs.status, "recommended");
});

// 2. Output 包裹 JSON 字符串（多层解包）
ok("Output 包裹内层 JSON 字符串", () => {
  const raw = { Output: JSON.stringify({ output: [cardBlock(HEAD, W(), X(), V())] }) };
  const cards = parseWorkflowCards(raw);
  assert.strictEqual(cards.length, 1);
  assert.strictEqual(cards[0].title, "测试新闻");
});

// 3. outputList 容器键
ok("outputList 容器键", () => {
  const raw = { outputList: [cardBlock(HEAD, W(), X(), V())] };
  assert.strictEqual(parseWorkflowCards(raw).length, 1);
});

// 4. 嵌套 data / result / output
ok("嵌套 data.result.output", () => {
  const raw = { data: { result: { output: [cardBlock(HEAD, W(), X(), V())] } } };
  assert.strictEqual(parseWorkflowCards(raw).length, 1);
});

// 5. 多卡片
ok("多卡片", () => {
  const a = cardBlock("新闻标题：A\n新闻链接：https://a", W("A"), X("A"), V("A"));
  const b = cardBlock("新闻标题：B\n新闻链接：https://b", W("B"), X("B"), V("B"));
  const cards = parseWorkflowCards([a, b]);
  assert.strictEqual(cards.length, 2);
  assert.strictEqual(cards[0].title, "A");
  assert.strictEqual(cards[1].title, "B");
});

// 6. 混合推荐 / 跳过（小红书不推荐，微博视频推荐）
ok("混合推荐 / 跳过", () => {
  const xhsSkip =
    "----- 小红书发布包 -----\n推荐决策：不推荐，负面风险较高\n封面文案：\n正文：\n";
  const cards = parseWorkflowCards([cardBlock(HEAD, W(), xhsSkip, V())]);
  assert.strictEqual(cards[0].xhs.status, "skipped");
  assert.ok(cards[0].xhs.reason.includes("负面风险"));
  assert.strictEqual(cards[0].weibo.status, "recommended");
  assert.strictEqual(cards[0].video.status, "recommended");
});

// 7. 四镜头分镜
ok("四镜头分镜", () => {
  const shots = `分镜脚本：
1. <0-3秒｜画面：豆子特写｜口播：你喝的豆子变贵了。｜屏幕字幕：涨价真相｜素材要求：深色背景>
2. <3-15秒｜画面：产区航拍｜口播：海拔高昼夜温差大。｜屏幕字幕：海拔风味｜素材要求：空镜>
3. <15-30秒｜画面：数据图表｜口播：销量环比涨四成。｜屏幕字幕：+42%｜素材要求：动效>
4. <30-45秒｜画面：手冲收尾｜口播：选它不踩雷。｜屏幕字幕：点击了解｜素材要求：静物>`;
  const v = `----- 短视频发布包 -----\n推荐决策：推荐\n${shots}\n完整口播稿：全文\n`;
  const cards = parseWorkflowCards([cardBlock(HEAD, W(), X(), v)]);
  assert.strictEqual(cards[0].video.shots.length, 4);
  assert.strictEqual(cards[0].video.shots[0].timeRange, "0-3秒");
  assert.strictEqual(cards[0].video.shots[0].scene, "豆子特写");
  assert.strictEqual(cards[0].video.shots[3].subtitle, "点击了解");
});

// 8. 分镜=无（有口播稿 → 推荐但零镜头；口播稿也无 → empty）
ok("分镜=无 / 空视频", () => {
  const vNoShot = "----- 短视频发布包 -----\n推荐决策：推荐\n分镜脚本：无\n完整口播稿：有稿\n";
  const withScript = parseWorkflowCards([cardBlock(HEAD, W(), X(), vNoShot)]);
  assert.strictEqual(withScript[0].video.shots.length, 0);
  assert.strictEqual(withScript[0].video.status, "recommended");

  const vEmpty = "----- 短视频发布包 -----\n推荐决策：推荐\n分镜脚本：无\n完整口播稿：无\n";
  const empty = parseWorkflowCards([cardBlock(HEAD, W(), X(), vEmpty)]);
  assert.strictEqual(empty[0].video.shots.length, 0);
  assert.strictEqual(empty[0].video.status, "empty");
});

// 附：决策判定（「推荐」不得误判为「不推荐」）
ok("决策精确匹配", () => {
  assert.strictEqual(parseDecision("推荐，热度高").status, "recommended");
  assert.strictEqual(parseDecision("不推荐，风险高").status, "skipped");
  assert.strictEqual(parseDecision("跳过").status, "skipped");
  assert.strictEqual(parseShots("无").length, 0);
});

console.log(`\n${pass} 项全部通过 ✔`);
