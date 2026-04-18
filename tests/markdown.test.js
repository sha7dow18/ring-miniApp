const md = require("../miniprogram/utils/markdown.js");

describe("parseInline", () => {
  test("plain text → single normal run", () => {
    expect(md.parseInline("hello world")).toEqual([{ t: "n", c: "hello world" }]);
  });

  test("bold detection", () => {
    const runs = md.parseInline("这是 **粗体** 文本");
    expect(runs).toEqual([
      { t: "n", c: "这是 " },
      { t: "b", c: "粗体" },
      { t: "n", c: " 文本" }
    ]);
  });

  test("inline code", () => {
    const runs = md.parseInline("use `npm install` first");
    expect(runs).toEqual([
      { t: "n", c: "use " },
      { t: "c", c: "npm install" },
      { t: "n", c: " first" }
    ]);
  });

  test("mixed bold and code", () => {
    const runs = md.parseInline("**注意** 请运行 `test`");
    expect(runs.map(r => r.t)).toEqual(["b", "n", "c"]);
  });

  test("empty input → empty run", () => {
    expect(md.parseInline("")).toEqual([{ t: "n", c: "" }]);
  });

  test("bold with asterisks inside not greedy", () => {
    const runs = md.parseInline("**a** and **b**");
    expect(runs.filter(r => r.t === "b").map(r => r.c)).toEqual(["a", "b"]);
  });
});

describe("parseBlocks", () => {
  test("empty → no blocks", () => {
    expect(md.parseBlocks("")).toEqual([]);
    expect(md.parseBlocks(null)).toEqual([]);
  });

  test("single paragraph", () => {
    const blocks = md.parseBlocks("你好");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("p");
    expect(blocks[0].runs[0].c).toBe("你好");
  });

  test("heading levels", () => {
    const blocks = md.parseBlocks("# H1\n## H2\n### H3");
    expect(blocks).toHaveLength(3);
    expect(blocks[0].type).toBe("h");
    expect(blocks[0].level).toBe(1);
    expect(blocks[1].level).toBe(2);
    expect(blocks[2].level).toBe(3);
  });

  test("unordered list groups consecutive items", () => {
    const blocks = md.parseBlocks("- apple\n- banana\n- cherry");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("ul");
    expect(blocks[0].items).toHaveLength(3);
    expect(blocks[0].items[1].runs[0].c).toBe("banana");
  });

  test("ordered list detection", () => {
    const blocks = md.parseBlocks("1. first\n2. second");
    expect(blocks[0].type).toBe("ol");
    expect(blocks[0].items).toHaveLength(2);
  });

  test("paragraph then list then paragraph", () => {
    const text = "intro line\n\n- a\n- b\n\noutro line";
    const blocks = md.parseBlocks(text);
    expect(blocks.map(b => b.type)).toEqual(["p", "ul", "p"]);
  });

  test("bold inside list item preserved", () => {
    const blocks = md.parseBlocks("- 注意 **温度**");
    const runs = blocks[0].items[0].runs;
    expect(runs.some(r => r.t === "b" && r.c === "温度")).toBe(true);
  });

  test("multi-line paragraph collapsed with newline runs", () => {
    const blocks = md.parseBlocks("line one\nline two");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("p");
    const hasNewline = blocks[0].runs.some(r => r.c === "\n");
    expect(hasNewline).toBe(true);
  });
});
