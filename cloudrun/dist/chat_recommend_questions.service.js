"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendQuestionsService = void 0;
const constant_1 = require("./constant");
const llm_1 = require("./llm");
class RecommendQuestionsService {
    constructor(botContext) {
        this.botContext = botContext;
    }
    async genRecommendQuestionMessages({ historyChatList = [], content = '' }) {
        var _a, _b, _c, _d;
        const questionList = JSON.parse((_b = (_a = this.botContext.info) === null || _a === void 0 ? void 0 : _a.initQuestions) !== null && _b !== void 0 ? _b : '[]');
        let question = '请问有什么需要帮助的嘛?';
        if ((questionList === null || questionList === void 0 ? void 0 : questionList.length) !== 0) {
            question = questionList[0];
        }
        historyChatList.push({
            role: constant_1.BOT_ROLE_USER,
            content: content
        });
        const messages = [
            {
                role: 'user',
                content: `根据用户的对话内容，结合历史提问以及智能体介绍和设定，生成接下来用户可能问的3个问题，不要直接回答用户的问题或者其他问题

        历史提问使用 [HISTORY] 和 [END HISTORY]符号包裹 
        [HISTORY]
        ${historyChatList === null || historyChatList === void 0 ? void 0 : historyChatList.filter((item) => {
                    return item.role === constant_1.BOT_ROLE_USER;
                }).map((item) => {
                    return item.content;
                }).join('\n')}
        [END HISTORY]

        智能体介绍和设定使用 [AGENT] 和 [END AGENT]符号包裹 
        
        [AGENT]
        介绍: ${(_c = this.botContext.info) === null || _c === void 0 ? void 0 : _c.introduction},
        设定: ${(_d = this.botContext.info) === null || _d === void 0 ? void 0 : _d.agentSetting}
        [END AGENT]

        推荐的问题格式是，并且问题中不要有多余的字符
        
        ${question}
        
        问题的分隔用换行符,特别注意问题中不能出现换行符,否则会出现错误
        `
            }
        ];
        return messages;
    }
    async chat(params) {
        const messages = await this.genRecommendQuestionMessages({
            historyChatList: params.history,
            content: params.msg
        });
        const agent = new llm_1.LLMCommunicator(this.botContext, {
            ...this.botContext.config,
            searchEnable: false,
            mcpEnable: false
        });
        await agent.stream({
            messages,
            recordId: 'recommend-questions'
        });
    }
}
exports.RecommendQuestionsService = RecommendQuestionsService;
//# sourceMappingURL=chat_recommend_questions.service.js.map