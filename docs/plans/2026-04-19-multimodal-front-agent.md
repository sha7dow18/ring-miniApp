# Multimodal Front Agent Plan

**Goal:** Replace the Tencent hosted bot with a single multimodal front-end agent for the mini program, using WeChat's native `wx.cloud.extend.AI.createModel().streamText()` tool-calling capability plus structured UI cards.
**Scope:** Included: AI runtime, tool registry, card assembly, AI chat page refactor, config cleanup, session persistence format update, and tests. Excluded: database migrations, compatibility shims, cloud functions, and non-AI pages.
**Architecture:** The mini program remains a front-end app that talks directly to CloudBase database/storage and WeChat AI models. The agent becomes a local runtime that uses native model tool execution for async health/product/profile queries and converts structured tool results into deterministic card parts for rendering in chat.
**Success criteria:** Text and image messages both go through one agent entry; the agent can query health/profile/product data through registered tools; health/product tool results can render as chat cards; product recommendation ranking reflects health-state weighting instead of flat category matching; recommendation cards support direct open-detail and add-to-cart actions; Tencent hosted bot dependency is removed; tests cover the new runtime and card assembly helpers.

---

## Docs Impact

| File | Action | What changes |
|------|--------|-------------|
| `docs/README.md` | Update | Register the new multimodal front agent sprint plan and refreshed AI architecture summary. |
| `docs/plans/2026-04-19-multimodal-front-agent.md` | Create | Record the one-agent, front-end-native AI redesign and verification plan. |

---

## Tasks

### Task 1: Build the front-end multimodal agent runtime

**Files:**
- Create: `miniprogram/services/agentRuntime.js`
- Create: `miniprogram/services/agentTools.js`
- Create: `miniprogram/services/agentCards.js`
- Modify: `miniprogram/services/aiService.js`
- Modify: `miniprogram/config/index.js`

**Steps:**
1. Write acceptance criteria in `tests/agentRuntime.test.js` and `tests/agentCards.test.js`.
2. Run `npm test -- --runInBand tests/agentRuntime.test.js tests/agentCards.test.js` — confirm the new specs fail before implementation.
3. Implement a single front-end agent runtime that chooses a text or vision model per message, registers native tools, and records tool executions for card assembly.
4. Run `npm test -- --runInBand tests/agentRuntime.test.js tests/agentCards.test.js` — confirm the new runtime helpers pass.
5. Update docs if the AI architecture surface changes.
6. Commit: `feat(ai): add front-end multimodal agent runtime`

---

### Task 2: Rebuild the AI chat page around structured cards

**Files:**
- Modify: `miniprogram/pages/ai-chat/index.js`
- Modify: `miniprogram/pages/ai-chat/index.wxml`
- Modify: `miniprogram/pages/ai-chat/index.wxss`
- Modify: `miniprogram/services/sessionService.js`
- Delete: `miniprogram/services/agentService.js`

**Steps:**
1. Write acceptance criteria in `tests/aiChatPage.test.js`.
2. Run `npm test -- --runInBand tests/aiChatPage.test.js` — confirm the new page specs fail before implementation.
3. Replace the page's dual text/image pipeline with a single agent entry, persist card parts in sessions, and render health/product cards inline.
4. Run `npm test -- --runInBand tests/aiChatPage.test.js` — confirm the AI page behaviors pass.
5. Update docs: `docs/README.md` — add the new sprint entry and service summary.
6. Commit: `feat(ai-chat): render multimodal agent cards`

---

### Task 3: Verify the end-to-end AI rewrite

**Files:**
- Modify: `docs/README.md`

**Steps:**
1. Run `npm test -- --runInBand` — confirm the full suite passes.
2. Review changed files against this plan and remove dead AI code left by the hosted bot path.
3. Update docs minimally for the final architecture state.
4. Run `git status --short` — confirm only intended files changed.
5. Commit: `test(ai): verify front-end agent rewrite`

---

### Task 4: Strengthen product ranking and card CTA actions

**Files:**
- Modify: `miniprogram/services/agentTools.js`
- Modify: `miniprogram/services/agentCards.js`
- Modify: `miniprogram/pages/ai-chat/index.js`
- Modify: `miniprogram/pages/ai-chat/index.wxml`
- Modify: `miniprogram/pages/ai-chat/index.wxss`
- Modify: `tests/agentCards.test.js`
- Modify: `tests/agentRuntime.test.js`
- Modify: `tests/aiChatPage.test.js`

**Steps:**
1. Extend acceptance criteria in `tests/agentCards.test.js`, `tests/agentRuntime.test.js`, and `tests/aiChatPage.test.js` for weighted ranking plus add-to-cart/detail CTAs.
2. Run `npm test -- --runInBand tests/agentCards.test.js tests/agentRuntime.test.js tests/aiChatPage.test.js` — confirm the new specs fail before implementation.
3. Refine product ranking in `agentTools.js` and expose dual CTA metadata from `agentCards.js`.
4. Update the AI chat card UI and handlers so users can add to cart or open details directly from the recommendation card.
5. Run `npm test -- --runInBand tests/agentCards.test.js tests/agentRuntime.test.js tests/aiChatPage.test.js` — confirm the focused specs pass.
6. Commit: `feat(ai): strengthen recommendation cards`

---

## Verification (Phase 5)

- [ ] `npm test -- --runInBand` passes with 0 failures
- [ ] Docs Impact items verified: `git diff <plan-sha>..HEAD --name-only`
- [ ] `docs/README.md` updated
- [ ] `git status` is clean
