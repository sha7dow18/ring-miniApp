# AI Loop Order Plan

**Goal:** Fix the mini program AI chat so the assistant timeline reflects the real CloudBase agent event order: thinking, tool calls/results, later thinking, then final text, instead of always rendering an empty text part first.
**Scope:** Included: AI chat page event ordering, thinking/tool part rendering, assistant part serialization, focused tests, and a small prompt adjustment to avoid narrating fake tool calls in markdown. Excluded: broader AI architecture changes.
**Success criteria:** When the cloud agent emits event sequences, the UI renders parts in arrival order; tool blocks can appear before final text; thinking is visible; tests cover ordered part insertion; the backend prompt no longer encourages fake textual tool narration.

---

## Docs Impact

| File | Action | What changes |
|------|--------|-------------|
| `docs/README.md` | Update | Note that AI chat now renders true event order with visible thinking/tool states. |
| `docs/plans/2026-04-20-ai-loop-order.md` | Create | Record the event-order fix for cloud-agent chat rendering. |

---

## Tasks

### Task 1: Make assistant parts follow actual event order

**Files:**
- Modify: `miniprogram/pages/ai-chat/index.js`
- Modify: `miniprogram/pages/ai-chat/index.wxml`
- Modify: `miniprogram/pages/ai-chat/index.wxss`
- Modify: `miniprogram/services/agentService.js`
- Modify: `tests/aiChatPage.test.js`

**Steps:**
1. Add/adjust focused tests for tool parts before text and visible thinking parts.
2. Confirm the new tests fail before implementation.
3. Replace the initial empty text-part approach with append/update helpers that preserve event arrival order.
4. Render thinking parts distinctly from tool and final text parts.
5. Run focused AI chat tests and confirm they pass.
6. Commit: `fix(ai-chat): preserve cloud agent event order`

### Task 2: Reduce fake tool narration from the backend prompt

**Files:**
- Modify: `cloudrun/bot-config.yaml`

**Steps:**
1. Add concise instructions telling the agent not to narrate planned tool calls in final markdown because the client renders tool state separately.
2. Rebuild the cloud agent package if needed.
3. Commit: `tune(agent): stop narrating tool calls`

### Task 3: Verify

**Files:**
- Modify: `docs/README.md`

**Steps:**
1. Run full repo tests.
2. Update docs summary.
3. Ensure worktree is clean.
4. Commit: `test(ai): verify event order fix`
