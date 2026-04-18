const sessionService = require("../miniprogram/services/sessionService.js");

describe("sessionService.tagFromText", () => {
  test("returns 舌诊 when image present (regardless of text)", () => {
    expect(sessionService.tagFromText("", true)).toBe("舌诊");
    expect(sessionService.tagFromText("随便写点什么", true)).toBe("舌诊");
    expect(sessionService.tagFromText("最近睡不好", true)).toBe("舌诊");
  });

  test("舌 keywords → 舌诊", () => {
    expect(sessionService.tagFromText("帮我看看舌苔", false)).toBe("舌诊");
    expect(sessionService.tagFromText("我的舌头白", false)).toBe("舌诊");
    expect(sessionService.tagFromText("show me my tongue", false)).toBe("舌诊");
  });

  test("睡眠 keywords → 睡眠", () => {
    expect(sessionService.tagFromText("最近总是睡不好", false)).toBe("睡眠");
    expect(sessionService.tagFromText("失眠怎么办", false)).toBe("睡眠");
    expect(sessionService.tagFromText("熬夜太多", false)).toBe("睡眠");
    expect(sessionService.tagFromText("I cannot sleep", false)).toBe("睡眠");
    expect(sessionService.tagFromText("多梦", false)).toBe("睡眠");
  });

  test("体质 keywords → 体质", () => {
    expect(sessionService.tagFromText("我是什么体质", false)).toBe("体质");
    expect(sessionService.tagFromText("湿热体质怎么调理", false)).toBe("体质");
    expect(sessionService.tagFromText("阳虚怎么办", false)).toBe("体质");
    expect(sessionService.tagFromText("痰湿调理方案", false)).toBe("体质");
  });

  test("unknown text → 通用", () => {
    expect(sessionService.tagFromText("你好", false)).toBe("通用");
    expect(sessionService.tagFromText("", false)).toBe("通用");
    expect(sessionService.tagFromText("今天天气怎么样", false)).toBe("通用");
  });

  test("handles undefined/null", () => {
    expect(sessionService.tagFromText(undefined, false)).toBe("通用");
    expect(sessionService.tagFromText(null, false)).toBe("通用");
  });

  test("priority: image beats all keyword matches", () => {
    expect(sessionService.tagFromText("我熬夜失眠", true)).toBe("舌诊");
  });
});

describe("sessionService.tagClass", () => {
  test("maps Chinese tag to ASCII class", () => {
    expect(sessionService.tagClass("舌诊")).toBe("tongue");
    expect(sessionService.tagClass("睡眠")).toBe("sleep");
    expect(sessionService.tagClass("体质")).toBe("constitution");
    expect(sessionService.tagClass("通用")).toBe("default");
  });

  test("unknown tag → default", () => {
    expect(sessionService.tagClass("nope")).toBe("default");
    expect(sessionService.tagClass("")).toBe("default");
    expect(sessionService.tagClass(undefined)).toBe("default");
  });
});
