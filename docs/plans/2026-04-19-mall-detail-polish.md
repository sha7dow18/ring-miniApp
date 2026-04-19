# Mall Detail Polish Plan

**Goal:** Make the mall-detail page feel more refined and unified with the updated mall listing while preserving the current purchase flow.
**Scope:** Included: improve the product hero presentation, tighten title/price/tag hierarchy, refine the detail content layout, strengthen the action area, and remove small local style/data redundancies. Excluded: product schema changes, checkout/payment behavior changes, and any new backend or cloud capability.
**Architecture:** The detail page already has a stable product-loading and action API. The least risky polish is to keep the data flow unchanged, simplify the page-state shape, and move the visual refinement into WXML/WXSS with only small computed-display helpers in JS.
**Success criteria:** The detail page presents the product in a more premium Chinese TCM wellness style; information hierarchy is clearer; the action area stays strong and easy to use; local dead/redundant detail-page code is removed; detail-page tests cover the key success and navigation paths; tests and token checks pass.

---

## Docs Impact

| File | Action | What changes |
|------|--------|-------------|
| `docs/plans/2026-04-19-mall-detail-polish.md` | Create | Record the mall-detail polish goal, scope, and verification criteria. |
| `docs/README.md` | Update | Add this sprint plan to the docs index. |

---

## Tasks

### Task 1: Redesign product detail hero and content hierarchy

**Files:**
- Modify: `miniprogram/pages/mall-detail/index.wxml`
- Modify: `miniprogram/pages/mall-detail/index.wxss`
- Modify: `miniprogram/pages/mall-detail/index.js`

**Steps:**
1. Define acceptance as: the product image, category, title, price, and description feel calmer and more intentional on first view.
2. Restructure the WXML minimally around hero, summary, detail content, and action bar sections.
3. Implement the visual polish in WXSS while keeping the earthy TCM design language.
4. Add only the smallest JS display helpers needed by the new layout.
5. Remove any local page-state or style indirection made unnecessary by the redesign.
6. Commit: `polish(mall-detail): refine product hero and hierarchy`

---

### Task 2: Strengthen detail-page behavior coverage

**Files:**
- Modify: `tests/mallDetailPage.test.js`

**Steps:**
1. Add acceptance criteria for successful load, add-to-cart outcomes, and key navigations.
2. Run `npm test -- --runInBand mallDetailPage.test.js` and confirm the new criteria fail first.
3. Implement only the runtime changes required to satisfy those tests.
4. Re-run `npm test -- --runInBand mallDetailPage.test.js` and confirm it passes.
5. Keep scope local to the detail page.
6. Commit: `test(mall-detail): cover key detail interactions`

---

### Task 3: Final verification and small cleanup

**Files:**
- Modify: `docs/README.md`

**Steps:**
1. Update the docs index for this sprint.
2. Run `npm test` and `bash scripts/check-tokens.sh`.
3. Verify Docs Impact via `git diff --name-only`.
4. Ensure `git status` is clean.
5. Commit: `docs(mall-detail): record detail polish sprint`

---

## Verification (Phase 5)

- [x] `npm test` passes with 0 failures
- [x] `bash scripts/check-tokens.sh` passes
- [x] Docs Impact items verified: `git diff --name-only`
- [x] `docs/README.md` updated
- [x] `git status` is clean
