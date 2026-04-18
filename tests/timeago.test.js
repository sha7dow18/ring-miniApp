const ta = require("../miniprogram/utils/timeago.js");

const NOW = new Date("2026-04-18T15:00:00");
const m = (ago) => new Date(NOW - ago);

describe("relative", () => {
  test("just now", () => {
    expect(ta.relative(m(30 * 1000), NOW)).toBe("刚刚");
  });
  test("minutes ago", () => {
    expect(ta.relative(m(5 * 60 * 1000), NOW)).toBe("5 分钟前");
  });
  test("earlier today shows today HH:MM", () => {
    expect(ta.relative(new Date("2026-04-18T09:15:00"), NOW)).toBe("今天 09:15");
  });
  test("yesterday", () => {
    expect(ta.relative(new Date("2026-04-17T22:30:00"), NOW)).toBe("昨天 22:30");
  });
  test("3 days ago", () => {
    expect(ta.relative(new Date("2026-04-15T10:00:00"), NOW)).toBe("3 天前");
  });
  test("over a week → ISO-ish date", () => {
    expect(ta.relative(new Date("2026-03-20T08:00:00"), NOW)).toBe("2026-03-20");
  });
  test("string input parses", () => {
    expect(ta.relative("2026-04-18T14:59:20", NOW)).toBe("刚刚");
  });
  test("invalid input returns empty", () => {
    expect(ta.relative(null, NOW)).toBe("");
    expect(ta.relative("not-a-date", NOW)).toBe("");
  });
});

describe("bucket", () => {
  test("today", () => {
    expect(ta.bucket(m(60 * 1000), NOW)).toBe("today");
  });
  test("yesterday", () => {
    expect(ta.bucket(new Date("2026-04-17T12:00:00"), NOW)).toBe("yesterday");
  });
  test("within 7 days", () => {
    expect(ta.bucket(new Date("2026-04-14T12:00:00"), NOW)).toBe("week");
  });
  test("older", () => {
    expect(ta.bucket(new Date("2026-03-20T12:00:00"), NOW)).toBe("older");
  });
});
