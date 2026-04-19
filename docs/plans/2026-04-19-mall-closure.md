# Mall Closure Plan

**Goal:** Restore a usable default mall experience by ensuring products exist in the cloud-backed catalog, fixing misleading empty-state behavior, and cleaning small dead-code leftovers from the recent home trend-chart migration.
**Scope:** Included: product catalog seeding when the cloud `products` collection is empty, mall-page empty-state semantics, mall-flow verification, and removal of confirmed dead home assets/export leakage. Excluded: real payment integration, mall visual redesign, and any fallback from cloud product data back to local mock state.
**Architecture:** The mall is already designed as a cloud-only commerce flow, so the least risky fix is to keep cloud as the single source of truth and programmatically backfill seed products into that collection when it is empty. This preserves the requirement that listing/detail/cart/order remain real cloud flows while removing the fragile manual console-import dependency.
**Success criteria:** The app seeds cloud products on launch when `products` is empty; the mall page shows products by default with no keyword; empty-state copy distinguishes empty catalog from search miss; the mall chain remains cloud-backed except payment; dead home artifacts identified in exploration are removed; relevant tests and checks pass.

---

## Docs Impact

| File | Action | What changes |
|------|--------|-------------|
| `docs/plans/2026-04-19-mall-closure.md` | Create | Record the mall-closure goal, scope, and verification criteria. |
| `docs/README.md` | Update | Add this plan and update the service/data note for product seeding. |

---

## Tasks

### Task 1: Make cloud product catalog self-seeding

**Files:**
- Modify: `miniprogram/services/productService.js`
- Modify: `miniprogram/app.js`
- Modify: `tests/productService.test.js`

**Steps:**
1. Add acceptance criteria in `tests/productService.test.js` for seeding an empty `products` collection and leaving a non-empty collection unchanged.
2. Run `npm test -- --runInBand productService.test.js` and confirm the new criteria fail first.
3. Implement minimal cloud seeding in `productService.js` and wire it into app bootstrap in `app.js`.
4. Re-run `npm test -- --runInBand productService.test.js` and confirm it passes.
5. Update docs references if the product-service role changes.
6. Commit: `fix(mall): seed cloud products when catalog is empty`

---

### Task 2: Fix mall empty-state semantics

**Files:**
- Modify: `miniprogram/pages/mall/index.js`
- Modify: `miniprogram/pages/mall/index.wxml`
- Modify: `tests/homePage.test.js` or a new focused mall page test if needed

**Steps:**
1. Define acceptance as: default empty catalog and keyword miss use different user-facing copy.
2. Add/adjust a focused test if the logic is moved into JS state.
3. Implement the smallest page-state change needed so the zero-keyword case no longer says “试试其他关键词”.
4. Re-run the targeted test command.
5. Keep scope to behavior/copy only.
6. Commit: `fix(mall): separate empty catalog from search miss`

---

### Task 3: Clean confirmed home dead leftovers and verify closure

**Files:**
- Delete: `miniprogram/assets/health/icon_sleep.png`
- Delete: `miniprogram/assets/health/icon_sport_ring.png`
- Modify: `docs/README.md`

**Steps:**
1. Remove only artifacts confirmed unused during exploration.
2. Run `npm test` and `bash scripts/check-tokens.sh`.
3. Update docs index/service note in `docs/README.md`.
4. Verify mall closure status for final handoff: listing/detail/cart/order cloud-backed, payment mock.
5. Commit: `chore(home): remove dead trend-migration leftovers`

---

## Verification (Phase 5)

- [x] `npm test` passes with 0 failures
- [x] `bash scripts/check-tokens.sh` passes
- [x] Docs Impact items verified: `git diff 61b7dd8..HEAD --name-only`
- [x] `docs/README.md` updated
- [x] `git status` is clean
