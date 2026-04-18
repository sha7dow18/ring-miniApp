const aiService = require("../miniprogram/services/aiService.js");

describe("aiService.hasImage", () => {
  test("true when image part has url", () => {
    expect(aiService.hasImage([{ type: "image", url: "https://x.com/a.jpg" }])).toBe(true);
  });
  test("false when image has no url", () => {
    expect(aiService.hasImage([{ type: "image", url: "" }])).toBe(false);
    expect(aiService.hasImage([{ type: "image" }])).toBe(false);
  });
  test("false for text-only", () => {
    expect(aiService.hasImage([{ type: "text", content: "hi" }])).toBe(false);
  });
  test("handles empty/null", () => {
    expect(aiService.hasImage([])).toBe(false);
    expect(aiService.hasImage(null)).toBe(false);
    expect(aiService.hasImage(undefined)).toBe(false);
  });
});

describe("aiService.buildSystemPrompt", () => {
  test("no context returns base prompt", () => {
    expect(aiService.buildSystemPrompt()).toBe(aiService.BASE_SYSTEM_PROMPT);
    expect(aiService.buildSystemPrompt("")).toBe(aiService.BASE_SYSTEM_PROMPT);
  });

  test("with context appends to base", () => {
    const ctx = "用户最近健康数据：xxx";
    const p = aiService.buildSystemPrompt(ctx);
    expect(p).toContain(aiService.BASE_SYSTEM_PROMPT);
    expect(p).toContain(ctx);
    expect(p.indexOf(aiService.BASE_SYSTEM_PROMPT)).toBe(0);
  });
});

describe("aiService.toApiMessages", () => {
  test("produces system prompt as first message", () => {
    const out = aiService.toApiMessages([]);
    expect(out).toHaveLength(1);
    expect(out[0].role).toBe("system");
  });

  test("text-only user message", () => {
    const msgs = [
      { role: "user", parts: [{ type: "text", content: "你好" }] }
    ];
    const out = aiService.toApiMessages(msgs);
    expect(out).toHaveLength(2);
    expect(out[1]).toEqual({ role: "user", content: "你好" });
  });

  test("image + text becomes content array (multimodal)", () => {
    const msgs = [
      { role: "user", parts: [
        { type: "image", url: "https://x.com/a.jpg" },
        { type: "text", content: "什么体质" }
      ]}
    ];
    const out = aiService.toApiMessages(msgs);
    expect(out[1].role).toBe("user");
    expect(Array.isArray(out[1].content)).toBe(true);
    expect(out[1].content).toContainEqual({ type: "text", text: "什么体质" });
    expect(out[1].content).toContainEqual({ type: "image_url", image_url: { url: "https://x.com/a.jpg" } });
  });

  test("assistant message passes through", () => {
    const msgs = [
      { role: "assistant", parts: [{ type: "text", content: "你好啊" }] }
    ];
    const out = aiService.toApiMessages(msgs);
    expect(out[1]).toEqual({ role: "assistant", content: "你好啊" });
  });

  test("skips message with empty parts", () => {
    const msgs = [
      { role: "user", parts: [] },
      { role: "user", parts: [{ type: "text", content: "hi" }] }
    ];
    const out = aiService.toApiMessages(msgs);
    expect(out).toHaveLength(2); // system + one user
  });

  test("joins multiple text parts", () => {
    const msgs = [
      { role: "user", parts: [
        { type: "text", content: "line1" },
        { type: "text", content: "line2" }
      ]}
    ];
    const out = aiService.toApiMessages(msgs);
    expect(out[1].content).toBe("line1\nline2");
  });

  test("image part with no url is ignored", () => {
    const msgs = [
      { role: "user", parts: [
        { type: "image", url: "" },
        { type: "text", content: "hi" }
      ]}
    ];
    const out = aiService.toApiMessages(msgs);
    expect(out[1].content).toBe("hi");
  });

  test("health context flows into system prompt", () => {
    const out = aiService.toApiMessages([], "最近 HRV 55");
    expect(out[0].content).toContain("最近 HRV 55");
    expect(out[0].content).toContain(aiService.BASE_SYSTEM_PROMPT);
  });
});

describe("aiService id helpers", () => {
  test("msgId is unique and prefixed", () => {
    const a = aiService.msgId();
    const b = aiService.msgId();
    expect(a).toMatch(/^msg_/);
    expect(a).not.toBe(b);
  });

  test("nowISO returns parseable ISO string", () => {
    const s = aiService.nowISO();
    expect(new Date(s).toISOString()).toBe(s);
  });
});
