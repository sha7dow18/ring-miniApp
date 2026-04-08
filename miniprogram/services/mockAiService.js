const mockStore = require("../utils/mockStore.js");

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nowText() {
  const d = new Date();
  const p = function(v) { return v < 10 ? ("0" + v) : ("" + v); };
  return d.getFullYear() + "-" + p(d.getMonth()+1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
}

function wait(ms) { return new Promise(function(r){ setTimeout(r,ms); }); }
function pickOne(list) { return list[randomBetween(0, list.length-1)]; }

var DIALOGUE_GROUPS = [
  { name: "睡眠问题", turns: [
    { triggers:["睡不好","睡眠","失眠","入睡困难","夜里醒","早醒","睡不着"], reply:"能理解，睡眠问题会让白天状态大打折扣。我先帮你梳理：你更像哪种情况——A躺下很久睡不着，B睡着后夜里容易醒，C很早就醒来睡不回去？" },
    { triggers:["白天困","注意力","烦躁","是的","对的","会的","确实","嗯","有影响","有"], reply:"这就比较典型了。给你一个7天可操作小计划：\n1）固定上床时间，日波动控制在30分钟内；\n2）睡前60分钟停止刷手机；\n3）下午16:00后不喝咖啡和浓茶；\n4）每晚做8分钟慢呼吸放松。\n第3天和第7天各复盘一次。" },
    { triggers:["慢呼吸怎么做","呼吸方法","怎么做慢呼吸","慢呼吸"], reply:"慢呼吸：鼻子吸气4秒，屏住2秒，嘴呼出6秒，一个循环。每晚睡前做8分钟，保持自然舒适，坚持3天以上效果才明显。" },
    { triggers:["多久能好","要多久","能改善吗","有效吗"], reply:"睡眠改善通常需要1到2周才有明显感受。关键是节律稳定优先，即使某天睡不好，第二天仍按固定时间起床，不要补觉超过1小时。连续2周无改善建议线下就医。" }
  ]},
  { name: "舌诊咨询", turns: [
    { triggers:["舌苔","舌头","舌象","舌色","舌诊","拍舌照","舌照","看舌头"], reply:"好的，我来帮你解读舌象。你是要上传舌照，还是用文字描述？\n文字描述可以说：舌色偏淡、偏红还是偏暗？舌苔薄白、厚白、黄腻还是几乎没有？有没有裂纹、齿痕或口干口苦？" },
    { triggers:["厚","腻","黄苔","白苔","淡白","偏红","偏暗","裂纹","齿痕","口干","口苦"], reply:"根据你的描述，舌苔偏厚腻或偏黄，通常提示近期消化负担偏重、饮食偏油甜或睡眠不足。这是健康管理参考，不是诊断。\n你最近有没有口黏、腹胀、吃完发困或食欲变差？" },
    { triggers:["口黏","腹胀","发困","食欲差","胃口不好","都有","有点"], reply:"建议先做三件事：\n1）这周减少油炸、甜食和夜宵；\n2）吃饭细嚼慢咽，七分饱就停；\n3）饭后散步10-15分钟。\n连续执行5天，看舌苔和腹胀有没有减轻。\n\n提示：若口腔有白斑、红斑或创口超过2周不愈，建议线下口腔科检查。" },
    { triggers:["怎么拍舌照","拍照注意","拍摄技巧","怎么拍","拍舌头"], reply:"拍舌照要点：\n1）自然光下拍，关美颜和滤镜；\n2）拍前用清水轻漱；\n3）轻轻自然伸舌1-2秒；\n4）镜头正对舌面，舌头占画面60%-80%。" }
  ]},
  { name: "体质分析", turns: [
    { triggers:["体质","气虚","阴虚","湿热","痰湿","血瘀","气郁","阳虚","没力气","怕冷","怕热","容易累"], reply:"好的，我来帮你做体质倾向分析：\nA 容易疲劳、说话没气、容易感冒；\nB 总觉口干、手脚心热、睡眠浅；\nC 身体沉重、困倦、容易腹胀。\n选A/B/C或自己描述都可以。" },
    { triggers:["选A","偏A","选B","偏B","选C","偏C","疲劳感","沉重","手脚热","困倦"], reply:"参考方向：\n偏A气虚：不熬夜不透支，规律作息，保证蛋白质，运动循序渐进。\n偏B阴虚：改善睡眠优先，少酒精辛辣，多补水，避免高压。\n偏C痰湿：减少油甜饮食，减少久坐，每天步行30分钟以上。\n你最想先改善哪个方向？" },
    { triggers:["怎么调整","调整方案","给我计划","具体方案","怎么做","先做什么","具体"], reply:"4周小框架：\n第1周：稳节律——固定起床时间、三餐时间；\n第2周：做减法——减少一个最差习惯（熬夜或夜宵或久坐选一个）；\n第3周：加运动——每天20-30分钟低强度步行或拉伸；\n第4周：复盘——对比第1周的睡眠、精力、消化。" },
    { triggers:["体质能改变吗","会一直这样吗","能变好吗","体质固定吗"], reply:"体质不是固定的。作息、饮食、运动、压力都会影响它。坚持4到8周的生活方式调整，通常就会有可感受到的变化。" }
  ]}
];

function findReply(message, memory) {
  var msg = message || "";
  if (memory && Number.isInteger(memory.groupIndex)) {
    var group = DIALOGUE_GROUPS[memory.groupIndex];
    if (group) {
      var startTurn = Number.isInteger(memory.turnIndex) ? memory.turnIndex + 1 : 0;
      for (var t = startTurn; t < group.turns.length; t++) {
        var turn = group.turns[t];
        for (var k = 0; k < turn.triggers.length; k++) {
          if (msg.indexOf(turn.triggers[k]) !== -1) { return { reply: turn.reply, groupIndex: memory.groupIndex, turnIndex: t }; }
        }
      }
    }
  }
  for (var g = 0; g < DIALOGUE_GROUPS.length; g++) {
    var grp = DIALOGUE_GROUPS[g];
    for (var ti = 0; ti < grp.turns.length; ti++) {
      var tr = grp.turns[ti];
      for (var ki = 0; ki < tr.triggers.length; ki++) {
        if (msg.indexOf(tr.triggers[ki]) !== -1) { return { reply: tr.reply, groupIndex: g, turnIndex: ti }; }
      }
    }
  }
  return null;
}

function getQuickQuestions() {
  return ["最近总是睡不好怎么办","我想了解一下舌诊","我容易疲劳是什么体质","怎么拍舌照更准确","给我一个调整计划"];
}

async function analyzeTongue(imagePath) {
  if (!mockStore.isConnected()) { throw new Error("请先连接设备后再进行舌诊"); }
  await wait(randomBetween(1500,2000));
  var tongues=["淡红舌","偏红舌","淡白舌","偏暗舌"],coatings=["薄白苔","微黄苔","少苔","偏厚苔"],cracks=["未见明显裂纹","轻度裂纹","中度裂纹"],toothMarks=["无明显齿痕","轻度齿痕","中度齿痕"],moistures=["湿润","偏干","稍腻"];
  var riskTips=["舌象会受光线、饮食和作息影响，建议结合连续几天状态一起看。","如果伴随持续疼痛、出血、吞咽困难，建议尽快线下评估。","若症状正在加重，请优先线下就医。"];
  var suggestions=["连续3-5天尽量在23:30前入睡。","饮食先做减法：少辛辣油炸、少夜宵。","每天安排20-30分钟低强度活动。"];
  var result={imagePath:imagePath,tongueBody:pickOne(tongues),tongueCoating:pickOne(coatings),crack:pickOne(cracks),toothMark:pickOne(toothMarks),moisture:pickOne(moistures),riskTip:pickOne(riskTips),suggestion:pickOne(suggestions),analyzedAt:nowText()};
  mockStore.setAiState({latestTongueResult:result,canChat:true});
  return result;
}

function getConstitutionSummary(metrics) {
  var m=metrics||{},heartRate=Number(m.heartRate||0),stress=Number(m.stress||0),hrv=Number(m.hrv||0),spo2=Number(m.spo2||0),temp=Number(m.temperature||0);
  var qixu=Math.max(20,Math.min(90,55+(heartRate<68?10:0)+(hrv<45?12:0)));
  var yinxu=Math.max(20,Math.min(90,50+(temp>36.6?12:0)+(stress>60?10:0)));
  var shire=Math.max(20,Math.min(90,48+(stress>58?12:0)+(temp>36.7?8:0)));
  var pinghe=Math.max(20,Math.min(90,78-Math.floor((Math.abs(heartRate-75)+Math.abs(stress-45))/3)+(spo2>=97?6:0)));
  return {items:[{key:"qixu",label:"气虚倾向",score:qixu},{key:"yinxu",label:"阴虚倾向",score:yinxu},{key:"shire",label:"湿热倾向",score:shire},{key:"pinghe",label:"平和倾向",score:pinghe}],note:"仅供健康管理参考，不等同于医学诊断。"};
}

async function sendChatMessage(message, healthSummary, chatHistory) {
  if (!mockStore.isConnected()) { throw new Error("设备未连接，暂不可问诊"); }
  await wait(randomBetween(900,1400));
  var state=mockStore.getState(),memory=(state.aiState&&state.aiState.chatMemory)||{};
  var found=findReply(message,memory),content="";
  if (found) {
    content=found.reply;
    mockStore.setAiState({chatMemory:{groupIndex:found.groupIndex,turnIndex:found.turnIndex}});
  } else {
    content="我在。你可以说：最近睡不好、我想了解舌诊、我容易疲劳是什么体质，我会给你详细解答。";
  }
  return {id:"a_"+Date.now(),role:"ai",type:"text",content:content,createdAt:nowText()};
}

function clearChatHistory() {
  var init=[{id:"init",role:"ai",type:"text",content:"你好，我是你的健康助手。你可以直接说最近最困扰的一件事（比如睡眠、舌诊、体质分析），我会帮你做分析并给出可执行建议。",createdAt:nowText()}];
  mockStore.setAiState({chatHistory:init,chatMemory:{}});
  return init;
}

module.exports={analyzeTongue:analyzeTongue,getConstitutionSummary:getConstitutionSummary,sendChatMessage:sendChatMessage,getQuickQuestions:getQuickQuestions,clearChatHistory:clearChatHistory};
