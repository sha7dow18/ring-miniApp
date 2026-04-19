// 轻量 markdown → blocks 解析器
// 支持：**粗体**、`code`、# / ## / ### 标题、- / * 无序列表、N. 有序列表、--- 分隔线、表格、段落
// 不支持：代码块 ```、引用、链接、图片、html（AI 回复暂不需要）
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
  var i = 0;

  function parseTableCells(line) {
    var trimmed = String(line || "").trim();
    if (!trimmed || trimmed.indexOf("|") === -1) return null;
    var body = trimmed;
    if (body.charAt(0) === "|") body = body.slice(1);
    if (body.charAt(body.length - 1) === "|") body = body.slice(0, -1);
    return body.split("|").map(function(cell) {
      var raw = cell.trim();
      return { raw: raw, runs: parseInline(raw) };
    });
  }

  function isTableDivider(line, size) {
    var cells = parseTableCells(line);
    if (!cells || cells.length !== size) return false;
    return cells.every(function(cell) {
      return /^:?-{3,}:?$/.test(cell.raw);
    });
  }

  function flushPara() { if (para) { blocks.push(para); para = null; } }
  function flushList() { if (list) { blocks.push(list); list = null; } }

  for (; i < lines.length; i++) {
    var line = lines[i].replace(/\s+$/, "");

    if (!line.trim()) { flushPara(); flushList(); continue; }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushPara(); flushList();
      blocks.push({ type: "hr" });
      continue;
    }

    var headerCells = parseTableCells(line);
    if (headerCells && i + 1 < lines.length && isTableDivider(lines[i + 1], headerCells.length)) {
      flushPara(); flushList();
      var rows = [];
      i += 2;
      while (i < lines.length) {
        var rowLine = lines[i].replace(/\s+$/, "");
        var rowCells = parseTableCells(rowLine);
        if (!rowLine.trim() || !rowCells || rowCells.length !== headerCells.length) {
          i -= 1;
          break;
        }
        rows.push(rowCells);
        i += 1;
      }
      blocks.push({ type: "table", headers: headerCells, rows: rows });
      continue;
    }

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
