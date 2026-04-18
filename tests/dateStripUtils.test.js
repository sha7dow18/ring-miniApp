const u = require("../miniprogram/utils/dateStripUtils.js");

describe("dateKey / parseKey", () => {
  test("dateKey zero-pads", () => {
    expect(u.dateKey(new Date(2026, 3, 1))).toBe("2026-04-01");
    expect(u.dateKey(new Date(2026, 10, 23))).toBe("2026-11-23");
  });
  test("parseKey inverse", () => {
    const d = u.parseKey("2026-04-17");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3);
    expect(d.getDate()).toBe(17);
  });
  test("parseKey bad → null", () => {
    expect(u.parseKey("nope")).toBeNull();
    expect(u.parseKey("")).toBeNull();
    expect(u.parseKey(null)).toBeNull();
  });
});

describe("isSameDay", () => {
  test("same date same day", () => {
    expect(u.isSameDay(new Date(2026, 3, 17, 10), new Date(2026, 3, 17, 20))).toBe(true);
  });
  test("adjacent days", () => {
    expect(u.isSameDay(new Date(2026, 3, 17), new Date(2026, 3, 18))).toBe(false);
  });
});

describe("generateTabs", () => {
  const TODAY = new Date(2026, 3, 17); // 2026-04-17

  test("length = total", () => {
    const tabs = u.generateTabs("2026-04-17", 30, TODAY);
    expect(tabs).toHaveLength(30);
  });

  test("center position is total/2", () => {
    const tabs = u.generateTabs("2026-04-17", 30, TODAY);
    const mid = Math.floor(30 / 2);
    expect(tabs[mid].key).toBe("2026-04-17");
  });

  test("isToday flag marks today", () => {
    const tabs = u.generateTabs("2026-04-22", 10, TODAY);
    const todayTab = tabs.find(t => t.isToday);
    expect(todayTab).toBeDefined();
    expect(todayTab.key).toBe("2026-04-17");
  });

  test("week label Chinese", () => {
    const tabs = u.generateTabs("2026-04-17", 7, TODAY);
    expect(tabs[0].week).toMatch(/^周[日一二三四五六]$/);
  });

  test("spans month boundary correctly", () => {
    const tabs = u.generateTabs("2026-04-01", 10, TODAY);
    const keys = tabs.map(t => t.key);
    expect(keys).toContain("2026-03-28");
    expect(keys).toContain("2026-04-01");
    expect(keys).toContain("2026-04-05");
  });

  test("bad center → empty", () => {
    expect(u.generateTabs("bad", 10, TODAY)).toEqual([]);
  });

  test("isFirstOfMonth marks day-1", () => {
    const tabs = u.generateTabs("2026-04-01", 10, TODAY);
    const first = tabs.find(t => t.key === "2026-04-01");
    expect(first.isFirstOfMonth).toBe(true);
  });
});

describe("shiftDay", () => {
  test("forward 1 day", () => {
    expect(u.shiftDay("2026-04-17", 1)).toBe("2026-04-18");
  });
  test("backward 1 day", () => {
    expect(u.shiftDay("2026-04-17", -1)).toBe("2026-04-16");
  });
  test("cross month forward", () => {
    expect(u.shiftDay("2026-04-30", 2)).toBe("2026-05-02");
  });
  test("cross month backward", () => {
    expect(u.shiftDay("2026-04-01", -2)).toBe("2026-03-30");
  });
  test("cross year forward", () => {
    expect(u.shiftDay("2026-12-31", 1)).toBe("2027-01-01");
  });
  test("bad key returned unchanged", () => {
    expect(u.shiftDay("bad", 1)).toBe("bad");
  });
});

describe("centerScrollLeft", () => {
  test("idx 0 → scrollLeft 0 (chip near start, clamped)", () => {
    expect(u.centerScrollLeft(0, 375, 84, 12, 48)).toBe(0);
  });

  test("idx 15 (center of 30-chip window) → non-zero positive", () => {
    const px = u.centerScrollLeft(15, 375, 84, 12, 48);
    expect(px).toBeGreaterThan(0);
  });

  test("scrollLeft grows linearly with idx past threshold", () => {
    const a = u.centerScrollLeft(15, 375, 84, 12, 48);
    const b = u.centerScrollLeft(20, 375, 84, 12, 48);
    expect(b - a).toBeGreaterThan(0);
  });
});

describe("monthText", () => {
  test("formats Chinese month", () => {
    expect(u.monthText("2026-04-17")).toBe("2026年4月");
    expect(u.monthText("2026-11-03")).toBe("2026年11月");
  });
  test("bad key → empty", () => {
    expect(u.monthText("bad")).toBe("");
  });
});
