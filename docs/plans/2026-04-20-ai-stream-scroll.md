# AI Stream Scroll Plan

**Goal:** Let users manually scroll the AI chat while the assistant is still streaming, instead of forcing the message list back to the bottom on every chunk.
**Scope:** Included: AI chat scroll-follow state, message scroll event handling, focused tests, and docs. Excluded: broader layout redesign.
**Success criteria:** Streaming still auto-follows by default, but once the user manually scrolls the message area during a response, later chunks no longer force the window back to the bottom.

## Docs Impact

| File | Action | What changes |
|------|--------|-------------|
| `docs/README.md` | Update | Note that AI chat streaming now allows manual scroll interruption. |
| `docs/plans/2026-04-20-ai-stream-scroll.md` | Create | Record the streaming scroll-follow behavior fix. |

## Tasks

### Task 1: Make stream auto-follow interruptible
- Modify: `miniprogram/pages/ai-chat/index.js`
- Modify: `miniprogram/pages/ai-chat/index.wxml`
- Modify: `tests/aiChatPage.test.js`

Steps:
1. Add a failing test for manual scroll disabling auto-follow.
2. Add local scroll-follow state and user-interaction handlers.
3. Only update `scrollToId` while follow mode is enabled.
4. Re-run focused tests.

### Task 2: Verify and document
- Modify: `docs/README.md`

Steps:
1. Run full repo tests.
2. Update docs note.
3. Ensure worktree is clean.
