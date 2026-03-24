Page({
  data: {
    messageList: [
      { id: 'init', role: 'ai', type: 'text', content: '您好！我是中医AI助手。您可以打字、发送舌象图片，或直接语音告诉我您的不适。' }
    ],
    scrollToId: '', 
    isKeyboard: true, // 默认开启键盘模式
    inputText: '' // 绑定的输入文字
  },

  // 切换输入模式
  toggleInputMode() {
    this.setData({ isKeyboard: !this.data.isKeyboard });
  },

  // 监听键盘输入
  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  // 发送文本消息
  sendText() {
    const text = this.data.inputText.trim();
    if (!text) return;

    this.appendMessage('user', 'text', text);
    this.setData({ inputText: '' }); // 清空输入框

    // 模拟将文字发送给大模型并获取回复
    this.mockAIResponse(`已接收到您的描述：${text}。正在为您结合体质进行分析...`);
  },

  // 调起原生相机/相册选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1, // 每次只能选1张
      mediaType: ['image'], // 只允许图片
      sourceType: ['album', 'camera'], // 允许相册和直接拍照
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath; // 获取本地临时图片路径
        
        // 将图片作为消息推入屏幕
        this.appendMessage('user', 'image', tempFilePath);
        
        // 模拟 AI 图片视觉识别返回
        this.mockAIResponse('已收到您的舌象/面色图片，正在调用视觉大模型进行特征提取...');
      }
    });
  },

  // 通用方法：追加消息并滚动到底部
  appendMessage(role, type, content) {
    const newMessageId = 'msg_' + Date.now();
    const newMsg = { id: newMessageId, role, type, content };
    
    this.setData({
      messageList: [...this.data.messageList, newMsg],
      scrollToId: `msg-${newMessageId}`
    });
  },

  // 模拟发送大模型网络请求并接收回复
  mockAIResponse(mockReplyText) {
    wx.showNavigationBarLoading(); // 顶部菊花转，模拟网络请求中
    setTimeout(() => {
      wx.hideNavigationBarLoading();
      this.appendMessage('ai', 'text', mockReplyText);
    }, 1500);
  },

  // 语音模拟 (与之前逻辑相同)
  handleTouchStart() { wx.showToast({ title: '正在录音...', icon: 'none' }); },
  handleTouchEnd() { 
    wx.hideToast();
    this.appendMessage('user', 'text', '(语音)我最近容易出汗。');
    this.mockAIResponse('气虚或阴虚可能导致多汗，请问您是白天动一下就出汗，还是晚上睡觉出汗？');
  }
});