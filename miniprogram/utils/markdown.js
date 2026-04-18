// 轻量 markdown → blocks 解析器
// 支持：**粗体**、`code`、# / ## / ### 标题、- / * 无序列表、N. 有序列表、段落
// 不支持：代码块 ```、表格、引用、链接、图片、html（AI 回复暂不需要）
// 每个 run 的 t：n (normal) | b (bold) | c (code)

function parseInline(text) {
  var runs = [];
  var re = /(\*\*([^*]+?)\*\*)|(`([^`]+?)`)/g;
  var lastIdx = 0;
  var m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) runs.push({ t: "n", c: text.slice(lastIdx, m.index) });
    if (m[1]) runs.push({ t: "b", c: m[2] });
    else if (m[3]) runs.push({ t: "c", c: m[4] });
    lastIdx = re.lastIndex;
  }
  if (lastIdx < text.length) runs.push({ t: "n", c: text.slice(lastIdx) });
  if (!runs.length) runs.push({ t: "n", c: "" });
  return runs;
}

function parseBlocks(text) {
  if (!text) return [];
  var lines = String(text).split(/\r?\n/);
  var blocks = [];
  var para = null;
  var list = null;

  function flushPara() { if (para) { blocks.push(para); para = null; } }
  function flushList() { if (list) { blocks.push(list); list = null; } }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].replace(/\s+$/, "");

    if (!line.trim()) { flushPara(); flushList(); continue; }

    var h = /^(#{1,3})\s+(.+)$/.exec(line);
    if (h) {
      flushPara(); flushList();
      blocks.push({ type: "h", level: h[1].length, runs: parseInline(h[2]) });
      continue;
    }

    var ul = /^[-*]\s+(.+)$/.exec(line);
    if (ul) {
      flushPara();
      if (!list || list.type !== "ul") { flushList(); list = { type: "ul", items: [] }; }
      list.items.push({ runs: parseInline(ul[1]) });
      continue;
    }

    var ol = /^(\d+)\.\s+(.+)$/.exec(line);
    if (ol) {
      flushPara();
      if (!list || list.type !== "ol") { flushList(); list = { type: "ol", items: [] }; }
      list.items.push({ runs: parseInline(ol[2]) });
      continue;
    }

    flushList();
    if (!para) para = { type: "p", runs: [] };
    if (para.runs.length) para.runs.push({ t: "n", c: "\n" });
    var inline = parseInline(line);
    for (var j = 0; j < inline.length; j++) para.runs.push(inline[j]);
  }

  flushPara(); flushList();
  return blocks;
}

module.exports = {
  parseInline: parseInline,
  parseBlocks: parseBlocks
};
