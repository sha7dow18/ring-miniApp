# Mall Product Read Plan

**Goal:** Remove the recently added mall auto-seeding path and fix the real problem: existing `products` records are not rendering in the mini-program frontend.
**Scope:** Included: delete auto-seeding logic, stop swallowing mall catalog read failures, route product reads through a single real cloud function path, and keep mall list/detail/cart/order flows cloud-backed. Explicitly excluded: payment integration, mall UI redesign, and any fake/local fallback product data.
**Architecture:** The mall catalog should be a real backend-owned data source, not something the client writes or repairs. A single cloud-function read path keeps the client simple, avoids permission mismatch between admin-managed `products` and end-user reads, and makes failures explicit instead of silently converting them to empty lists.
**Success criteria:** No auto-seeding remains in app bootstrap or product service; product list/detail read through a cloud-function-backed path; mall page distinguishes catalog read failure from genuine empty/search states; the rest of the mall chain remains cloud-backed; tests and token checks pass.

---

## Docs Impact

| File | Action | What changes |
|------|--------|-------------|
| `docs/plans/2026-04-19-mall-product-read.md` | Create | Record the removal of auto-seeding and the new catalog read strategy. |
| `docs/README.md` | Update | Replace the auto-seeding description with cloud-function catalog reads. |

---

## Tasks

### Task 1: Remove auto-seeding path

**Files:**
- Delete: `cloudfunctions/ensureProducts/index.js`
- Delete: `cloudfunctions/ensureProducts/package.json`
- Modify: `miniprogram/app.js`
- Modify: `miniprogram/services/productService.js`
- Modify: `tests/productService.test.js`

**Steps:**
1. Add acceptance criteria in `tests/productService.test.js` that product service no longer auto-seeds or self-heals missing catalog reads.
2. Run `npm test -- --runInBand productService.test.js` and confirm the new criteria fail first.
3. Remove seeding code minimally.
4. Re-run `npm test -- --runInBand productService.test.js` and confirm it passes.
5. Keep docs impact for later tasks.
6. Commit: `refactor(mall): remove client-driven product seeding`

---

### Task 2: Fix real catalog reads for the frontend

**Files:**
- Create: `cloudfunctions/productCatalog/index.js`
- Create: `cloudfunctions/productCatalog/package.json`
- Modify: `miniprogram/services/productService.js`
- Modify: `miniprogram/pages/mall/index.js`
- Modify: `tests/productService.test.js`
- Modify: `tests/mallPage.test.js`

**Steps:**
1. Define acceptance as: product reads use the backend-owned catalog path and explicit read failures surface to the page instead of masquerading as empty products.
2. Run `npm test -- --runInBand productService.test.js mallPage.test.js` and confirm the new criteria fail first.
3. Implement the smallest cloud-function read path and page-state handling needed.
4. Re-run `npm test -- --runInBand productService.test.js mallPage.test.js` and confirm it passes.
5. Keep the mall flow cloud-backed and free of fake product fallback.
6. Commit: `fix(mall): read catalog through cloud function`

---

### Task 3: Final verification and docs

**Files:**
- Modify: `docs/README.md`

**Steps:**
1. Update the service/data docs to describe the new product read path and remove auto-seeding language.
2. Run `npm test` and `bash scripts/check-tokens.sh`.
3. Verify docs impact via `git diff --name-only`.
4. Ensure `git status` is clean.
5. Commit: `docs(mall): document backend-owned catalog reads`

---

## Verification (Phase 5)

- [x] `npm test` passes with 0 failures
- [x] `bash scripts/check-tokens.sh` passes
- [x] Docs Impact items verified: `git diff --name-only`
- [x] `docs/README.md` updated
- [x] `git status` is clean
