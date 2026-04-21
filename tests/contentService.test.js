beforeEach(() => jest.resetModules());

describe("contentService pure fns", () => {
  test("matchesConstitution returns true for 'all' target", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/contentService.js");
    expect(svc.matchesConstitution({ targetConstitution: ["all"] }, "yinxu")).toBe(true);
    expect(svc.matchesConstitution({ targetConstitution: ["all"] }, null)).toBe(true);
  });

  test("matchesConstitution hits specific constitutions", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/contentService.js");
    expect(svc.matchesConstitution({ targetConstitution: ["yinxu"] }, "yinxu")).toBe(true);
    expect(svc.matchesConstitution({ targetConstitution: ["qixu"] }, "yinxu")).toBe(false);
    expect(svc.matchesConstitution({ targetConstitution: ["qixu"] }, null)).toBe(false);
  });

  test("matchesConstitution defaults to 'all' when field missing", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/contentService.js");
    expect(svc.matchesConstitution({}, "qixu")).toBe(true);
  });

  test("rankFeed puts specific-constitution matches before generic", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/contentService.js");
    const items = [
      { _id: "a", targetConstitution: ["all"], createdAt: new Date(2026, 3, 20) },
      { _id: "b", targetConstitution: ["yinxu"], createdAt: new Date(2026, 3, 19) },
      { _id: "c", targetConstitution: ["qixu"], createdAt: new Date(2026, 3, 21) }
    ];
    const ranked = svc.rankFeed(items, "yinxu");
    expect(ranked[0]._id).toBe("b"); // specific match first
    // a and c are "generic" from yinxu perspective; sorted by time desc
    expect(ranked[1]._id).toBe("c"); // c has all:false but matches "qixu" not "yinxu", counted as non-specific
    expect(ranked[2]._id).toBe("a");
  });

  test("typeLabel resolves known types", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/contentService.js");
    expect(svc.typeLabel("greeting")).toBe("晨间问候");
    expect(svc.typeLabel("seeding")).toBe("好物种草");
    expect(svc.typeLabel("unknown")).toBe("内容");
  });

  test("buildGeneratePrompt embeds constitution and type", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/contentService.js");
    const p = svc.buildGeneratePrompt("tip", "阴虚质");
    expect(p).toContain("阴虚质体质用户");
    expect(p).toContain("中医养生小贴士");
    expect(p).toContain("JSON");
  });

  describe("parseGenerated", () => {
    test("parses clean JSON", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/contentService.js");
      const r = svc.parseGenerated('{"title":"晚安","body":"早睡是硬道理","coverEmoji":"🌙"}');
      expect(r.title).toBe("晚安");
      expect(r.coverEmoji).toBe("🌙");
    });

    test("strips markdown fences", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/contentService.js");
      const r = svc.parseGenerated('```json\n{"title":"a","body":"b"}\n```');
      expect(r.title).toBe("a");
      expect(r.coverEmoji).toBe("✨"); // default
    });

    test("defaults coverEmoji when missing", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/contentService.js");
      const r = svc.parseGenerated('{"title":"a","body":"b"}');
      expect(r.coverEmoji).toBe("✨");
    });

    test("throws on empty/incomplete input", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/contentService.js");
      expect(() => svc.parseGenerated("")).toThrow("EMPTY_AI_RESPONSE");
      expect(() => svc.parseGenerated("no braces here")).toThrow("AI_RESPONSE_NOT_JSON");
      expect(() => svc.parseGenerated('{"title":"only"}')).toThrow("AI_RESPONSE_INCOMPLETE");
    });

    test("truncates overlong fields", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/contentService.js");
      const longTitle = "a".repeat(100);
      const longBody = "b".repeat(500);
      const r = svc.parseGenerated(JSON.stringify({ title: longTitle, body: longBody }));
      expect(r.title.length).toBeLessThanOrEqual(40);
      expect(r.body.length).toBeLessThanOrEqual(300);
    });
  });
});
