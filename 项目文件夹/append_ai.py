import pathlib
p = pathlib.Path(r'd:\微信小程序开发平台\ring\项目文件夹\miniprogram\services\mockAiService.js')
lines = p.read_text(encoding='utf-8').splitlines()
# 找到最后的 ]; 行并截断
end_idx = len(lines)
for i in range(len(lines)-1, -1, -1):
    if lines[i].strip() == '];':
        end_idx = i + 1
        break
base = '\n'.join(lines[:end_idx])
rest = '''

function findReply(message, memory) {
  var msg = message || "";
  if (memory && Number.isInteger(memory.groupIndex)) {
    var group = DIALOGUE_GROUPS[memory.groupIndex];
    if (group) {
      var startTurn = Number.isInteger(memory.turnIndex) ? memory.turnIndex + 1 : 0;
      for (var t = startTurn; t < group.turns.length; t++) {
        var turn = group.turns[t];
        for (var k = 0; k < turn.triggers.length; k++) {
          if (msg.indexOf(turn.triggers[k]) !== -1) {
            return { reply: turn.reply, groupIndex: memory.groupIndex, turnIndex: t };
          }
        }
      }
    }
  }
  for (var g = 0; g < DIALOGUE_GROUPS.length; g++) {
    var grp = DIALOGUE_GROUPS[g];
    for (var ti = 0; ti < grp.turns.length; ti++) {
      var tr = grp.turns[ti];
      for (var ki = 0; ki < tr.triggers.length; ki++) {
        if (msg.indexOf(tr.triggers[ki]) !== -1) {
          return { reply: tr.reply, groupIndex: g, turnIndex: ti };
        }
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
  await wait(randomBetween(1500, 2000));
  const tongues = ["淡红舌","偏红舌","淡白舌","偏暗舌"];
  const coatings = ["薄白苔","微黄苔","少苔","偏厚苔"];
  const cracks = ["未见明显裂纹","轻度裂纹","中度裂纹"];
  const toothMarks = ["无明显齿痕","轻度齿痕","中度齿痕"];
  const moistures = ["湿润","偏干","稍腻"];
  const riskTips = ["舌象会受光线、饮食和作息影响，建议结合连续几天状态一起看。","如果伴随持续疼痛、出血、吞咽困难，建议尽快线下评估。","若症状正在加重，请优先线下就医。"];
  const suggestions = ["连续3-5天尽量在23:30前入睡，观察白天精力变化。","饮食先做减法：少辛辣油炸、少夜宵。","每天安排20-30分钟低强度活动，保持规律补水。"];
  const result = { imagePath: imagePath, tongueBody: pickOne(tongues), tongueCoating: pickOne(coatings), crack: pickOne(cracks), toothMark: pickOne(toothMarks), moisture: pickOne(moistures), riskTip: pickOne(riskTips), suggestion: pickOne(suggestions), analyzedAt: nowText() };
  mockStore.setAiState({ latestTongueResult: result, canChat: true });
  return result;
}

function getConstitutionSummary(metrics) {
  const m = metrics || {};
  const heartRate = Number(m.heartRate || 0), stress = Number(m.stress || 0), hrv = Number(m.hrv || 0), spo2 = Number(m.spo2 || 0), temp = Number(m.temperature || 0);
  const qixu = Math.max(20, Math.min(90, 55 + (heartRate < 68 ? 10 : 0) + (hrv < 45 ? 12 : 0)));
  const yinxu = Math.max(20, Math.min(90, 50 + (temp > 36.6 ? 12 : 0) + (stress > 60 ? 10 : 0)));
  const shire = Math.max(20, Math.min(90, 48 + (stress > 58 ? 12 : 0) + (temp > 36.7 ? 8 : 0)));
  const pinghe = Math.max(20, Math.min(90, 78 - Math.floor((Math.abs(heartRate-75)+Math.abs(stress-45))/3) + (spo2 >= 97 ? 6 : 0)));
  return { items: [{ key:"qixu",label:"气虚倾向",score:qixu },{ key:"yinxu",label:"阴虚倾向",score:yinxu },{ key:"shire",label:"湿热倾向",score:shire },{ key:"pinghe",label:"平和倾向",score:pinghe }], note:"仅供健康管理参考，不等同于医学诊断。" };
}

async function sendChatMessage(message, healthSummary, chatHistory) {
  if (!mockStore.isConnected()) { throw new Error("设备未连接，暂不可问诊"); }
  await wait(randomBetween(900, 1400));
  const state = mockStore.getState();
  const memory = (state.aiState && state.aiState.chatMemory) || {};
  const found = findReply(message, memory);
  var content = "";
  if (found) {
    content = found.reply;
    mockStore.setAiState({ chatMemory: { groupIndex: found.groupIndex, turnIndex: found.turnIndex } });
  } else {
    content = "我在。你可以说：最近睡不好、我想了解舌诊、我容易疲劳是什么体质，我会给你详细解答。";
  }
  return { id: "a_" + Date.now(), role: "ai", type: "text", content: content, createdAt: nowText() };
}

function clearChatHistory() {
  const init = [{ id: "init", role: "ai", type: "text", content: "你好，我是你的健康助手。你可以直接说最近最困扰的一件事（比如睡眠、舌诊、体质分析），我会帮你做分析并给出可执行建议。", createdAt: nowText() }];
  mockStore.setAiState({ chatHistory: init, chatMemory: {} });
  return init;
}

module.exports = { analyzeTongue: analyzeTongue, getConstitutionSummary: getConstitutionSummary, sendChatMessage: sendChatMessage, getQuickQuestions: getQuickQuestions, clearChatHistory: clearChatHistory };
'''
p.write_text(base + rest, encoding='utf-8')
print('done', len((base + rest).splitlines()), 'lines')
