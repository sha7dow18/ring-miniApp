# Direct Products Read Plan

**Goal:** Remove the mall catalog cloud-function hop and make the mini-program read the `products` collection directly.
**Scope:** Included: delete the `productCatalog` cloud function, switch `productService` to direct cloud-database reads, keep mall/detail/cart/checkout behavior unchanged at the call-site level, and update tests/docs for the new permission model. Explicitly excluded: payment integration, mall UI redesign, and any mock/fallback product source.
**Architecture:** In this prototype, `products` is a simple public catalog managed in Tencent Cloud. With the collection permission set to admin-write + public-read, adding a cloud-function proxy only increases moving parts. Direct reads keep the data flow shorter and simpler while preserving the same service-layer API.
**Success criteria:** No `productCatalog` cloud-function dependency remains; `productService` reads `products` directly via `wx.cloud.database()`; existing mall/detail/cart/checkout flows still work through the same service API; tests and token checks pass; docs clearly state the required `products` permission.

---

## Docs Impact

| File | Action | What changes |
|------|--------|-------------|
| `docs/plans/2026-04-19-direct-products-read.md` | Create | Record the direct-read design and acceptance criteria. |
| `docs/README.md` | Update | Replace cloud-function catalog wording with direct-read + permission guidance. |

---

## Tasks

### Task 1: Remove cloud-function catalog dependency

**Files:**
- Delete: `cloudfunctions/productCatalog/index.js`
- Delete: `cloudfunctions/productCatalog/package.json`
- Modify: `miniprogram/services/productService.js`
- Modify: `tests/productService.test.js`

**Steps:**
1. Add acceptance criteria in `tests/productService.test.js` for direct `wx.cloud.database()` reads and no cloud-function calls.
2. Run `npm test -- --runInBand productService.test.js` and confirm the new criteria fail first.
3. Replace the catalog cloud-function path with direct collection reads.
4. Re-run `npm test -- --runInBand productService.test.js` and confirm it passes.
5. Keep the `productService` public API unchanged.
6. Commit: `refactor(mall): switch products to direct reads`

---

### Task 2: Keep mall consumer behavior stable

**Files:**
- Verify: `tests/mallPage.test.js`
- Verify: `tests/mallDetailPage.test.js`
- Verify: `tests/checkoutPage.test.js`

**Steps:**
1. Define acceptance as: the mall/detail/checkout pages keep their current failure semantics while the underlying data source changes.
2. Run `npm test -- --runInBand mallPage.test.js mallDetailPage.test.js checkoutPage.test.js` and confirm the pages still honor the same failure semantics.
3. Keep page-layer code and tests unchanged if the runtime contract stays the same.
4. Re-run the targeted page tests and confirm they pass.
5. Do not expand scope into unrelated page logic.
6. Commit: `test(mall): lock page behavior after direct reads`

---

### Task 3: Final docs and verification

**Files:**
- Modify: `docs/README.md`

**Steps:**
1. Document that `products` is read directly by the frontend and must use admin-write + public-read permission.
2. Run `npm test` and `bash scripts/check-tokens.sh`.
3. Verify Docs Impact via `git diff --name-only`.
4. Ensure `git status` is clean.
5. Commit: `docs(mall): document direct products reads`

---

## Verification (Phase 5)

- [x] `npm test` passes with 0 failures
- [x] `bash scripts/check-tokens.sh` passes
- [x] Docs Impact items verified: `git diff --name-only`
- [x] `docs/README.md` updated
- [x] `git status` is clean
