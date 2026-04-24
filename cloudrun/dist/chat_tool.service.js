"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatToolService = void 0;
class ChatToolService {
    constructor(botContext) {
        this.botContext = botContext;
    }
    async handleSearchNetwork({ msg, searchEnable, needSSE }) {
        var _a, _b, _c;
        if (!searchEnable) {
            return null;
        }
        const result = await this.botContext.bot.tools.searchNetwork(this.botContext.info.botId, msg);
        if ((result === null || result === void 0 ? void 0 : result.code) && ((_a = result === null || result === void 0 ? void 0 : result.code) === null || _a === void 0 ? void 0 : _a.length) !== 0) {
            throw new Error(`查询联网内容失败 ${result === null || result === void 0 ? void 0 : result.message}`);
        }
        if (result) {
            const data = {
                type: 'search',
                created: Date.now(),
                model: 'cloudbase-ai',
                role: 'assistant',
                content: '',
                search_info: {
                    search_results: (_b = result.searchInfo) === null || _b === void 0 ? void 0 : _b.searchResults
                },
                finish_reason: 'continue'
            };
            if (needSSE) {
                this.botContext.bot.sseSender.send(`data: ${JSON.stringify(data)}\n\n`);
            }
            if (result.content) {
                const netKnowledgeList = [
                    { question: msg, answer: (_c = result.content) !== null && _c !== void 0 ? _c : '' }
                ];
                const netKnowledgeText = netKnowledgeList
                    .map(({ question, answer }) => {
                    return `### 用户问题:\n${question}\n### 内容：\n${answer}`;
                })
                    .join('\n');
                const prompt = `

  以下是用户问题可能涉及的一些通过联网搜索出的信息以及相关资料。回答问题需要充分依赖这些相关资料。

  ${netKnowledgeText}

      `;
                return {
                    prompt: prompt,
                    result: result
                };
            }
        }
    }
    async handleSearchFile({ msg, files, needSSE }) {
        var _a, _b, _c;
        if ((files === null || files === void 0 ? void 0 : files.length) === 0 || !this.botContext.info.searchFileEnable) {
            return null;
        }
        const result = await this.botContext.bot.tools.searchFile(this.botContext.info.botId, msg, files);
        if ((result === null || result === void 0 ? void 0 : result.code) && ((_a = result === null || result === void 0 ? void 0 : result.code) === null || _a === void 0 ? void 0 : _a.length) !== 0) {
            throw new Error(`查询文件内容失败: ${result === null || result === void 0 ? void 0 : result.message}`);
        }
        if (result && result.content.length > 0) {
            const data = {
                type: "'search_file',",
                created: Date.now(),
                model: 'cloudbase-ai',
                role: 'assistant',
                content: (_b = result.content) !== null && _b !== void 0 ? _b : '',
                finish_reason: 'continue'
            };
            if (needSSE) {
                this.botContext.bot.sseSender.send(`data: ${JSON.stringify(data)}\n\n`);
            }
            const fileList = [{ question: msg, answer: (_c = result.content) !== null && _c !== void 0 ? _c : '' }];
            const searchFileText = fileList
                .map(({ question, answer }) => {
                return `### 标题:\n${question}\n### 内容：\n${answer}`;
            })
                .join('\n');
            const prompt = `
<file_search desc="基于图片或PDF等类型的文件检索">
  以下是用户问题可能涉及的一些通过上传图片或PDF等类型的文件检索出的信息以及相关资料。回答问题需要充分依赖这些相关资料。
  <file_search_result>
  ${searchFileText}
  </file_search_result>
</file_search>
`;
            return {
                prompt: prompt,
                result: result
            };
        }
    }
    async handleSearchDB({ msg, needSSE }) {
        var _a, _b, _c, _d, _e, _f;
        if (this.botContext.info.databaseModel.length === 0) {
            return null;
        }
        const result = await this.botContext.bot.tools.searchDB(this.botContext.info.botId, msg, this.botContext.info.databaseModel);
        if ((result === null || result === void 0 ? void 0 : result.code) && ((_a = result === null || result === void 0 ? void 0 : result.code) === null || _a === void 0 ? void 0 : _a.length) !== 0) {
            throw new Error(`查询数据模型内容失败: ${result === null || result === void 0 ? void 0 : result.message}`);
        }
        if (result) {
            const data = {
                type: 'db',
                created: Date.now(),
                role: 'assistant',
                content: '',
                finish_reason: 'continue',
                search_results: {
                    relateTables: (_d = (_c = (_b = result.searchResult) === null || _b === void 0 ? void 0 : _b.relateTables) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0
                }
            };
            if (needSSE) {
                this.botContext.bot.sseSender.send(`data: ${JSON.stringify(data)}\n\n`);
            }
            const prompt = `
<db_search desc="数据库查询">
  <db_search_result>
  ${(_f = (_e = result.searchResult) === null || _e === void 0 ? void 0 : _e.answerPrompt) !== null && _f !== void 0 ? _f : ''}
  </db_search_result>
</db_search>
`;
            return {
                prompt: prompt,
                result: result
            };
        }
    }
    async handleSearchKnowledgeBase({ msg, needSSE }) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (((_c = (_b = (_a = this.botContext) === null || _a === void 0 ? void 0 : _a.info) === null || _b === void 0 ? void 0 : _b.knowledgeBase) === null || _c === void 0 ? void 0 : _c.length) === 0) {
            return null;
        }
        const result = await this.botContext.bot.tools.searchKnowledgeBase(this.botContext.info.botId, msg, this.botContext.info.knowledgeBase);
        if ((result === null || result === void 0 ? void 0 : result.code) && ((_d = result === null || result === void 0 ? void 0 : result.code) === null || _d === void 0 ? void 0 : _d.length) !== 0) {
            throw new Error(`查询知识库内容失败: ${result === null || result === void 0 ? void 0 : result.message}`);
        }
        if (((_e = result === null || result === void 0 ? void 0 : result.documents) === null || _e === void 0 ? void 0 : _e.length) > 0) {
            const documentSetNameList = [];
            const fileMetaDataList = [];
            result === null || result === void 0 ? void 0 : result.documents.forEach(({ score, documentSet }) => {
                if (score < 0.7) {
                    return;
                }
                documentSetNameList.push(documentSet === null || documentSet === void 0 ? void 0 : documentSet.documentSetName);
                fileMetaDataList.push(documentSet === null || documentSet === void 0 ? void 0 : documentSet.fileMetaData);
            });
            if (documentSetNameList.length !== 0 && fileMetaDataList.length !== 0) {
                const result = {
                    type: 'knowledge',
                    created: Date.now(),
                    role: 'assistant',
                    content: '',
                    finish_reason: 'continue',
                    knowledge_base: Array.from(documentSetNameList),
                    knowledge_meta: Array.from(fileMetaDataList)
                };
                if (needSSE) {
                    (_h = (_g = (_f = this.botContext) === null || _f === void 0 ? void 0 : _f.bot) === null || _g === void 0 ? void 0 : _g.sseSender) === null || _h === void 0 ? void 0 : _h.send(`data: ${JSON.stringify(result)}\n\n`);
                }
            }
            const highScoreDocuments = (_j = result === null || result === void 0 ? void 0 : result.documents) === null || _j === void 0 ? void 0 : _j.filter(({ score }) => score > 0.7);
            if (highScoreDocuments.length === 0) {
                return {
                    prompt: '',
                    result: result
                };
            }
            const knowledgeText = highScoreDocuments
                .map(({ data }) => {
                return `### 内容：\n${data.text}`;
            })
                .join('\n');
            const prompt = `
<search_knowledge_base desc="知识库检索">
  以下是用户问题可能涉及的一些背景知识和相关资料，。回答问题需要充分依赖这些背景知识和相关资料。请优先参考这部分内容。
  <knowledge_base_result>
  ${knowledgeText}
  </knowledge_base_result>
</search_knowledge_base>
      `;
            return {
                prompt: prompt,
                result: result
            };
        }
        return {
            prompt: '',
            result: result
        };
    }
    async speechToText(input) {
        var _a;
        const result = await this.botContext.bot.tools.speechToText(this.botContext.info.botId, input.engSerViceType, input.voiceFormat, input.url);
        if ((result === null || result === void 0 ? void 0 : result.code) && ((_a = result === null || result === void 0 ? void 0 : result.code) === null || _a === void 0 ? void 0 : _a.length) !== 0) {
            throw new Error(`语音转文字失败: ${result === null || result === void 0 ? void 0 : result.message}`);
        }
        return result;
    }
    async textToSpeech(input) {
        var _a;
        const result = await this.botContext.bot.tools.textToSpeech(this.botContext.info.botId, input.text, input.voiceType);
        if ((result === null || result === void 0 ? void 0 : result.code) && ((_a = result === null || result === void 0 ? void 0 : result.code) === null || _a === void 0 ? void 0 : _a.length) !== 0) {
            throw new Error(`文字转语音失败: ${result === null || result === void 0 ? void 0 : result.message}`);
        }
        return result;
    }
    async getTextToSpeechResult(input) {
        var _a;
        const result = await this.botContext.bot.tools.getTextToSpeech(this.botContext.info.botId, input.taskId);
        if ((result === null || result === void 0 ? void 0 : result.code) && ((_a = result === null || result === void 0 ? void 0 : result.code) === null || _a === void 0 ? void 0 : _a.length) !== 0) {
            throw new Error(`查询文字转语音状态失败: ${result === null || result === void 0 ? void 0 : result.message}`);
        }
        return result;
    }
}
exports.ChatToolService = ChatToolService;
//# sourceMappingURL=chat_tool.service.js.map