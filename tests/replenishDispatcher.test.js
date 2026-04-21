beforeEach(() => jest.resetModules());

describe("replenishDispatcher pure fns", () => {
  test("pickDispatchable filters out non-pending", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/replenishDispatcher.js");
    const plans = [
      { _id: "a", status: "pending" },
      { _id: "b", status: "confirmed_by_child" },
      { _id: "c", status: "pending" }
    ];
    const out = svc.pickDispatchable(plans, new Set());
    expect(out.map((p) => p._id)).toEqual(["a", "c"]);
  });

  test("pickDispatchable skips already-pushed planIds", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/replenishDispatcher.js");
    const plans = [
      { _id: "a", status: "pending" },
      { _id: "b", status: "pending" },
      { _id: "c", status: "pending" }
    ];
    const out = svc.pickDispatchable(plans, new Set(["b"]));
    expect(out.map((p) => p._id)).toEqual(["a", "c"]);
  });

  test("pickDispatchable handles empty / null input", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/replenishDispatcher.js");
    expect(svc.pickDispatchable(null, new Set())).toEqual([]);
    expect(svc.pickDispatchable([], null)).toEqual([]);
  });

  test("formatInboxItem labels overdue and upcoming distinctly", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/replenishDispatcher.js");
    const past = svc.formatInboxItem({
      _id: "p1",
      productId: "m1",
      productName: "枸杞",
      qty: 1,
      cycleDays: 30,
      dueDate: new Date(Date.now() - 86400000)
    });
    expect(past.type).toBe("replenish_due");
    expect(past.title).toContain("该补了");
    expect(past.payload.overdue).toBe(true);
    expect(past.payload.planId).toBe("p1");

    const future = svc.formatInboxItem({
      _id: "p2",
      productId: "m2",
      productName: "三七",
      qty: 2,
      cycleDays: 60,
      dueDate: new Date(Date.now() + 86400000)
    });
    expect(future.title).toContain("即将用完");
    expect(future.payload.overdue).toBe(false);
  });

  test("formatInboxItem defaults missing productName", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/replenishDispatcher.js");
    const it = svc.formatInboxItem({ _id: "p1", productId: "m1" });
    expect(it.payload.productName).toBe("");
    expect(it.payload.qty).toBe(1);
  });
});
