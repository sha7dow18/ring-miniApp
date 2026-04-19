let pageDef;
let agentServiceMock;
let sessionServiceMock;
let aiServiceMock;
let cartServiceMock;

function makePage(data) {
  return {
    data: Object.assign({
      messages: [],
      inputText: "",
      attachment: null,
      isSending: false,
      isUploading: false,
      scrollToId: "",
      sessionId: "",
      sessionTag: "",
      showHistory: false,
      sessionList: [],
      sessionGroups: [],
      canSend: true,
      followStream: true
    }, data || {}),
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    },
    _syncCanSend() {},
    getTabBar() { return null; }
  };
}

beforeEach(() => {
  jest.resetModules();
  pageDef = null;
  agentServiceMock = {
    sendToBot: jest.fn(function(opts) {
      opts.callbacks.onThink('先判断是否需要查真实数据。')
      opts.callbacks.onToolCall({
        toolCallId: 'tool_1',
        name: 'get_health_summary',
        args: { days: 7 },
        status: 'executing'
      })
      opts.callbacks.onToolResult({
        toolCallId: 'tool_1',
        name: 'get_health_summary',
        args: { days: 7 },
        status: 'completed',
        summary: '近期重点关注睡眠与晚间放松。',
        result: {
          periodLabel: '最近7天',
          averageSleepScore: 71,
          averageStress: 58,
          averageHrv: 43,
          summaryText: '近期重点关注睡眠与晚间放松。',
          highlights: []
        }
      })
      opts.callbacks.onThink('已拿到摘要，继续筛商品。')
      opts.callbacks.onToolCall({
        toolCallId: 'tool_2',
        name: 'recommend_products',
        args: { limit: 3 },
        status: 'executing'
      })
      opts.callbacks.onToolResult({
        toolCallId: 'tool_2',
        name: 'recommend_products',
        args: { limit: 3 },
        status: 'completed',
        summary: '已返回 1 个商品',
        result: {
          reason: '根据你的睡眠状态，先从助眠类商品开始。',
          items: [
            {
              id: 'm2',
              name: '枣润安养饮',
              category: 'sleep',
              price: '699',
              imageName: 'mall_product_2.png',
              matchReason: '适合夜间安养'
            }
          ]
        }
      })
      opts.callbacks.onContent('根据你的睡眠状态，先从助眠类商品开始。')
      return Promise.resolve({
        content: '根据你的睡眠状态，先从助眠类商品开始。',
        thinking: '',
        tools: []
      })
    })
  };
  sessionServiceMock = {
    createSession: jest.fn(function() { return Promise.resolve({ _id: "sess_1", tag: "睡眠" }); }),
    updateMessages: jest.fn(function() { return Promise.resolve(); }),
    listSessions: jest.fn(function() { return Promise.resolve([]); }),
    loadSession: jest.fn(function() { return Promise.resolve(null); }),
    deleteSession: jest.fn(function() { return Promise.resolve(true); }),
    tagClass: jest.fn(function() { return "sleep"; })
  };
  aiServiceMock = {
    msgId: jest.fn()
      .mockReturnValueOnce("user_1")
      .mockReturnValueOnce("assistant_1"),
    nowISO: jest.fn(function() { return "2026-04-19T10:00:00.000Z"; }),
    uploadImage: jest.fn(function() { return Promise.resolve({ fileID: "file_1", url: "https://example.com/a.jpg" }); })
  };
  cartServiceMock = {
    addToCart: jest.fn(function() { return Promise.resolve({ _id: "cart_1", qty: 1 }); })
  };
  global.wx = {
    navigateTo: jest.fn(),
    switchTab: jest.fn(),
    chooseMedia: jest.fn(),
    previewImage: jest.fn(),
    showToast: jest.fn(),
    showModal: jest.fn(),
    showActionSheet: jest.fn()
  };
  global.Page = function(definition) { pageDef = definition; };
  jest.doMock('../miniprogram/services/agentService.js', () => agentServiceMock)
  jest.doMock("../miniprogram/services/sessionService.js", () => sessionServiceMock);
  jest.doMock("../miniprogram/services/aiService.js", () => aiServiceMock);
  jest.doMock("../miniprogram/services/cartService.js", () => cartServiceMock);
  require("../miniprogram/pages/ai-chat/index.js");
});

describe("ai-chat page", () => {
  test("doSend routes text through the multimodal agent and persists card parts", async () => {
    const page = makePage({ inputText: "最近睡不好" });

    await pageDef.doSend.call(page);

    expect(agentServiceMock.sendToBot).toHaveBeenCalled();
    expect(page.data.messages).toHaveLength(2);
    expect(page.data.messages[1].parts[0]).toMatchObject({ type: 'thinking' })
    expect(page.data.messages[1].parts[1]).toMatchObject({ type: 'tool', name: 'get_health_summary' })
    expect(page.data.messages[1].parts[2]).toMatchObject({ type: 'thinking' })
    expect(page.data.messages[1].parts[3]).toMatchObject({ type: 'tool', name: 'recommend_products' })
    expect(page.data.messages[1].parts[4]).toMatchObject({ type: 'text' })
    expect(page.data.messages[1].parts.some((part) => part.type === 'card' && part.cardType === 'product-recommend')).toBe(true)
    expect(sessionServiceMock.updateMessages).toHaveBeenCalledWith(
      "sess_1",
      expect.arrayContaining([
        expect.objectContaining({
          role: "assistant",
          parts: expect.arrayContaining([
            expect.objectContaining({ type: "card", cardType: "product-recommend" })
          ])
        })
      ])
    );
  });

  test("manual scroll disables auto-follow during streaming", async () => {
    let capturedCallbacks;
    agentServiceMock.sendToBot = jest.fn(function(opts) {
      capturedCallbacks = opts.callbacks;
      return Promise.resolve({ content: '', thinking: '', tools: [] });
    });

    const page = makePage({ inputText: '最近睡不好' });
    const sending = pageDef.doSend.call(page);
    await Promise.resolve();

    pageDef.onMsgsTouchStart.call(page);
    pageDef.onMsgsTouchMove.call(page);
    capturedCallbacks.onContent('第一段');
    await sending;

    expect(page.data.followStream).toBe(false);
    expect(page.data.scrollToId).toBe('');
  });

  test("onCardAction navigates to mall detail for product cards", () => {
    const page = makePage();

    pageDef.onCardAction.call(page, {
      currentTarget: {
        dataset: {
          type: "open-product",
          productId: "m2"
        }
      }
    });

    expect(wx.navigateTo).toHaveBeenCalledWith({ url: "/pages/mall-detail/index?id=m2" });
  });

  test("onCardAction adds the product to cart directly from the recommendation card", async () => {
    const page = makePage();

    await pageDef.onCardAction.call(page, {
      currentTarget: {
        dataset: {
          type: "add-cart",
          productId: "m2"
        }
      }
    });

    expect(cartServiceMock.addToCart).toHaveBeenCalledWith("m2", 1);
    expect(wx.showToast).toHaveBeenCalledWith({ title: "已加入购物车", icon: "success" });
  });
});
