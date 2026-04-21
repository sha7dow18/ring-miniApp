beforeEach(() => jest.resetModules());

describe("constitutionService pure fns", () => {
  test("CONSTITUTIONS has 9 entries with key/name/desc", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/constitutionService.js");
    expect(svc.CONSTITUTIONS).toHaveLength(9);
    svc.CONSTITUTIONS.forEach((c) => {
      expect(c.key).toMatch(/^[a-z]+$/);
      expect(c.name).toMatch(/.质$/);
      expect(c.desc.length).toBeGreaterThan(10);
    });
  });

  test("getKey resolves by key or Chinese name", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/constitutionService.js");
    expect(svc.getKey("yinxu")).toBe("yinxu");
    expect(svc.getKey("阴虚质")).toBe("yinxu");
    expect(svc.getKey("no-such")).toBeNull();
  });

  test("buildPrompt embeds all inputs", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/constitutionService.js");
    const p = svc.buildPrompt("七日摘要", { chills: "轻", fatigue: "中" }, true);
    expect(p).toContain("七日摘要");
    expect(p).toContain("怕冷程度：轻");
    expect(p).toContain("疲劳感：中");
    expect(p).toContain("已附上");
    expect(p).toContain("JSON");
  });

  test("buildPrompt handles missing data", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/constitutionService.js");
    const p = svc.buildPrompt("", null, false);
    expect(p).toContain("暂无数据");
    expect(p).toContain("未提供");
    expect(p).toContain("未填写");
  });

  describe("parseAssessment", () => {
    test("parses clean JSON", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/constitutionService.js");
      const raw = JSON.stringify({
        labels: [
          { key: "yinxu", name: "阴虚质", score: 72 },
          { key: "qiyu", name: "气郁质", score: 48 },
          { key: "pinghe", name: "平和质", score: 30 }
        ],
        summary: "以阴虚偏气郁为主",
        report: "建议滋阴..."
      });
      const r = svc.parseAssessment(raw);
      expect(r.labels[0].key).toBe("yinxu");
      expect(r.labels[0].score).toBe(72);
      expect(r.summary).toBe("以阴虚偏气郁为主");
      expect(r.report).toContain("滋阴");
    });

    test("strips markdown fences", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/constitutionService.js");
      const raw = '```json\n{"labels":[{"key":"pinghe","name":"平和质","score":90}],"summary":"a","report":"b"}\n```';
      const r = svc.parseAssessment(raw);
      expect(r.labels[0].key).toBe("pinghe");
    });

    test("normalizes score to 0-100 range", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/constitutionService.js");
      const raw = '{"labels":[{"key":"qixu","name":"气虚质","score":150},{"key":"yangxu","name":"阳虚质","score":-5}],"summary":"","report":""}';
      const r = svc.parseAssessment(raw);
      expect(r.labels[0].score).toBe(100);
      expect(r.labels[1].score).toBe(0);
    });

    test("resolves key from Chinese name when key missing", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/constitutionService.js");
      const raw = '{"labels":[{"name":"血瘀质","score":60}],"summary":"","report":""}';
      const r = svc.parseAssessment(raw);
      expect(r.labels[0].key).toBe("xueyu");
      expect(r.labels[0].name).toBe("血瘀质");
    });

    test("drops labels with unknown key and name", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/constitutionService.js");
      const raw = '{"labels":[{"key":"pinghe","name":"平和质","score":80},{"key":"xx","name":"yy","score":40}],"summary":"","report":""}';
      const r = svc.parseAssessment(raw);
      expect(r.labels).toHaveLength(1);
      expect(r.labels[0].key).toBe("pinghe");
    });

    test("throws EMPTY when input blank", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/constitutionService.js");
      expect(() => svc.parseAssessment("")).toThrow("EMPTY_AI_RESPONSE");
      expect(() => svc.parseAssessment(null)).toThrow("EMPTY_AI_RESPONSE");
    });

    test("throws NOT_JSON when no braces", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/constitutionService.js");
      expect(() => svc.parseAssessment("抱歉我无法回答")).toThrow("AI_RESPONSE_NOT_JSON");
    });

    test("throws PARSE_FAILED on broken JSON", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/constitutionService.js");
      expect(() => svc.parseAssessment('{"labels": [broken,,,]}')).toThrow("AI_RESPONSE_PARSE_FAILED");
    });

    test("throws NO_LABELS when labels missing", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/constitutionService.js");
      expect(() => svc.parseAssessment('{"summary":"x"}')).toThrow("AI_RESPONSE_NO_LABELS");
      expect(() => svc.parseAssessment('{"labels":[]}')).toThrow("AI_RESPONSE_NO_LABELS");
    });

    test("throws UNKNOWN_LABELS when all labels bad", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/constitutionService.js");
      expect(() => svc.parseAssessment('{"labels":[{"key":"xx","name":"yy"}]}')).toThrow("AI_RESPONSE_UNKNOWN_LABELS");
    });
  });

  describe("formatQuestionnaire", () => {
    test("returns 未填写 for empty/null", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/constitutionService.js");
      expect(svc.formatQuestionnaire(null)).toBe("（未填写）");
      expect(svc.formatQuestionnaire({})).toBe("（未填写）");
    });

    test("maps known keys to Chinese labels", () => {
      global.wx = { cloud: { database: () => ({}) } };
      const svc = require("../miniprogram/services/constitutionService.js");
      const out = svc.formatQuestionnaire({ chills: "明显", sleep: "差" });
      expect(out).toContain("怕冷程度：明显");
      expect(out).toContain("睡眠质量：差");
    });
  });
});
