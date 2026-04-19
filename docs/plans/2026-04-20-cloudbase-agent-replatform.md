# CloudBase Agent Replatform Plan

**Goal:** Replatform AI chat from the experimental front-end local loop to a real CloudBase-hosted Aita agent with server-side tools, while keeping the mini program as the custom chat and card UI client.
**Scope:** Included: cloudrun Aita agent source recovery and refactor, real server-side health/product tools, bot config updates, front-end `bot.sendMessage` integration, visible tool-step UI, card rendering based on real tool results, and verification. Excluded: backward compatibility with the local agent runtime, data migrations, and unrelated page refactors.
**Architecture:** Reuse the existing `ibot-aita` CloudRun agent project already downloaded into `cloudrun/`. Add real local server-side tools to the agent, keep SSE event streaming from the agent, and make the mini program parse `thinking` / `tool-call` / `tool-result` / `text` events into visible tool trace + deterministic cards.
**Success criteria:** The cloud agent can call real health/product tools; tool execution is visible in the mini program UI as true runtime state; health/product cards are rendered from actual tool results; the old front-end local loop is removed; the `ibot-aita` project builds and can be deployed back to CloudBase.

---

## Docs Impact

| File | Action | What changes |
|------|--------|-------------|
| `docs/README.md` | Update | Replace the front-end-local AI summary with the new CloudBase agent + client UI architecture. |
| `docs/plans/2026-04-20-cloudbase-agent-replatform.md` | Create | Record the shift to a real cloud agent, server-side tools, and visible front-end tool trace. |

---

## Tasks

### Task 1: Refactor the downloaded CloudRun Aita backend into a real tool-enabled agent

**Files:**
- Modify: `cloudrun/src/llm.ts`
- Modify: `cloudrun/src/chat_main.service.ts`
- Modify: `cloudrun/src/bot-config.yaml`
- Create: `cloudrun/src/custom_tools.ts`
- Create: `cloudrun/src/domain/health.ts`
- Create: `cloudrun/src/domain/products.ts`
- Modify: `cloudrun/package.json` (only if build/runtime dependencies are actually needed)

**Steps:**
1. Add acceptance checks around backend tool shaping and buildability.
2. Implement local server-side tools for `get_health_summary`, `search_products`, `get_product_detail`, and `recommend_products` using CloudBase database reads.
3. Bind those tools into the existing `LLMCommunicator` stream loop alongside any MCP tools.
4. Ensure SSE continues to emit `tool-call` and `tool-result` events for the mini program to observe.
5. Run backend build verification (`npm install && npm run build` in `cloudrun/`).
6. Commit: `feat(agent): add cloud tools to aita backend`

---

### Task 2: Reconnect the mini program AI page to the CloudBase agent

**Files:**
- Create: `miniprogram/services/agentService.js`
- Modify: `miniprogram/pages/ai-chat/index.js`
- Modify: `miniprogram/pages/ai-chat/index.wxml`
- Modify: `miniprogram/pages/ai-chat/index.wxss`
- Modify: `miniprogram/services/agentCards.js`
- Delete: `miniprogram/services/agentRuntime.js`
- Delete: `miniprogram/services/agentTools.js`
- Update tests under `tests/`

**Steps:**
1. Add failing tests for cloud-agent SSE parsing and visible tool trace parts.
2. Replace the local front-end agent runtime with a `bot.sendMessage` client that parses `thinking` / `tool-call` / `tool-result` / `text` events.
3. Surface tool progress in the chat UI and keep cards derived from completed tool results only.
4. Preserve detail and add-to-cart CTA actions from recommendation cards.
5. Run focused Jest tests for AI page/service changes.
6. Commit: `feat(ai-chat): consume cloud agent tool events`

---

### Task 3: Verify and prepare deployment back to CloudBase

**Files:**
- Modify: `docs/README.md`

**Steps:**
1. Run full mini program test suite.
2. Run backend build verification again in `cloudrun/`.
3. Review docs and dead code from the abandoned front-end local loop path.
4. Prepare deployment steps for updating `ibot-aita` in CloudBase.
5. Commit: `test(agent): verify cloud agent replatform`

---

## Verification (Phase 5)

- [ ] `npm test -- --runInBand` passes with 0 failures in repo root
- [ ] `npm install && npm run build` passes in `cloudrun/`
- [ ] `docs/README.md` updated to reflect the CloudBase agent architecture
- [ ] `git status` is clean
