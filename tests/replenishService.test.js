beforeEach(() => jest.resetModules());

const ORDER_MOCK = {
  _id: "ord1",
  payTime: new Date("2026-04-01T10:00:00Z"),
  items: [
    { productId: "m1", productName: "枸杞", qty: 1 },
    { productId: "m2", productName: "三七", qty: 2 },
    { productId: "m99", productName: "未登记商品", qty: 1 }
  ]
};

const CYCLES = { m1: 30, m2: 60 }; // m99 缺失 → DEFAULT

describe("replenishService pure fns", () => {
  test("plansFromOrder computes dueDate per product cycle", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/replenishService.js");
    const plans = svc.plansFromOrder(ORDER_MOCK, CYCLES);
    expect(plans).toHaveLength(3);
    expect(plans[0].productId).toBe("m1");
    expect(plans[0].cycleDays).toBe(30);
    expect(plans[0].status).toBe("pending");
    expect(plans[0].lastOrderId).toBe("ord1");
    expect(plans[0].qty).toBe(1);
    expect(plans[1].cycleDays).toBe(60);
    // m99 falls back to default
    expect(plans[2].cycleDays).toBe(svc.DEFAULT_CYCLE_DAYS);
  });

  test("plansFromOrder handles empty/invalid input", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/replenishService.js");
    expect(svc.plansFromOrder(null, {})).toEqual([]);
    expect(svc.plansFromOrder({}, {})).toEqual([]);
    expect(svc.plansFromOrder({ items: [] }, {})).toEqual([]);
  });

  test("plansFromOrder uses now if payTime missing", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/replenishService.js");
    const before = Date.now();
    const plans = svc.plansFromOrder({ _id: "x", items: [{ productId: "m1", qty: 1 }] }, { m1: 10 });
    const dueMs = new Date(plans[0].dueDate).getTime();
    expect(dueMs - before).toBeGreaterThanOrEqual(10 * 24 * 3600 * 1000 - 1000);
  });

  test("isDue returns true only for pending past-due", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/replenishService.js");
    const now = new Date("2026-05-01");
    expect(svc.isDue({ status: "pending", dueDate: new Date("2026-04-01") }, now)).toBe(true);
    expect(svc.isDue({ status: "pending", dueDate: new Date("2026-05-15") }, now)).toBe(false);
    expect(svc.isDue({ status: "confirmed_by_child", dueDate: new Date("2026-04-01") }, now)).toBe(false);
    expect(svc.isDue(null, now)).toBe(false);
  });

  test("partitionDue splits and sorts by due ascending", () => {
    global.wx = { cloud: { database: () => ({}) } };
    const svc = require("../miniprogram/services/replenishService.js");
    const now = new Date("2026-05-01");
    const plans = [
      { status: "pending", dueDate: new Date("2026-04-01") },
      { status: "pending", dueDate: new Date("2026-06-01") },
      { status: "pending", dueDate: new Date("2026-04-15") },
      { status: "rejected", dueDate: new Date("2026-04-01") }
    ];
    const result = svc.partitionDue(plans, now);
    expect(result.due).toHaveLength(2);
    expect(new Date(result.due[0].dueDate).getTime()).toBeLessThan(new Date(result.due[1].dueDate).getTime());
    expect(result.upcoming).toHaveLength(1);
    expect(result.upcoming[0].status).toBe("pending");
  });
});
