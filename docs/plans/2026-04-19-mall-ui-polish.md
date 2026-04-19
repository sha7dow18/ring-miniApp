# Mall UI Polish Plan

**Goal:** Improve the mall page's first-screen hierarchy and scrolling usability, especially by keeping search and category access available while scrolling.
**Scope:** Included: tighten the hero/header area, add a sticky utility/filter area, improve product-card readability, and remove small confirmed dead/redundant mall-adjacent styles. Excluded: payment flow changes, product data model changes, tabBar redesign, and new cloud features.
**Architecture:** The mall already uses native page scrolling and a stable `productService` API. The lowest-risk UX improvement is to keep that structure, make the search/cart/category controls sticky within the page flow, and reduce the static hero footprint so product browsing becomes the dominant interaction.
**Success criteria:** Search and category controls remain accessible while scrolling; the top section feels more balanced and less wasteful; product cards become easier to scan; localized cleanup removes redundant/unused styling without affecting behavior; tests and token checks pass.

---

## Docs Impact

| File | Action | What changes |
|------|--------|-------------|
| `docs/plans/2026-04-19-mall-ui-polish.md` | Create | Record the mall UI polish goal, scope, and verification criteria. |
| `docs/README.md` | Update | Add this sprint plan to the docs index. |
| `docs/design-system.md` | Update | Remove entries for deleted common utility classes. |

---

## Tasks

### Task 1: Redesign mall top area for better browse/search flow

**Files:**
- Modify: `miniprogram/pages/mall/index.wxml`
- Modify: `miniprogram/pages/mall/index.wxss`

**Steps:**
1. Define acceptance as: the hero becomes more compact and the page leads users to search, filter, and products faster.
2. Update WXML structure minimally around hero/search/banner/category sections.
3. Implement the new visual hierarchy in WXSS while preserving the existing earthy design language.
4. Verify the page still renders all current data states.
5. Keep data bindings unchanged where possible.
6. Commit: `polish(mall): tighten hero and improve first-screen hierarchy`

---

### Task 2: Keep search and category access visible during scroll

**Files:**
- Modify: `miniprogram/pages/mall/index.wxml`
- Modify: `miniprogram/pages/mall/index.wxss`
- Modify: `miniprogram/pages/mall/index.js`
- Modify: `tests/mallPage.test.js`

**Steps:**
1. Add acceptance criteria in `tests/mallPage.test.js` for any new mall-page state introduced by sticky/filter behavior.
2. Run `npm test -- --runInBand mallPage.test.js` and confirm the new criteria fail first if test changes are needed.
3. Implement sticky utility/filter behavior with the smallest viable page-state changes.
4. Re-run `npm test -- --runInBand mallPage.test.js` and confirm it passes.
5. Prefer sticky search/category over alternative floating-entry patterns.
6. Commit: `fix(mall): keep search and filters accessible on scroll`

---

### Task 3: Product card polish and small dead-code cleanup

**Files:**
- Modify: `miniprogram/pages/mall/index.wxss`
- Modify: `miniprogram/styles/common.wxss`
- Modify: `docs/design-system.md`

**Steps:**
1. Refine product-card spacing, tags, and CTA balance without changing product data semantics.
2. Remove only confirmed unused or redundant mall-adjacent utility styles.
3. Run `npm test` and `bash scripts/check-tokens.sh`.
4. Update docs impacted by the removed utility classes.
5. Confirm `git status` is clean.
6. Commit: `chore(mall): polish cards and trim dead styles`

---

## Verification (Phase 5)

- [x] `npm test` passes with 0 failures
- [x] `bash scripts/check-tokens.sh` passes
- [x] Docs Impact items verified: `git diff --name-only`
- [x] `docs/README.md` updated
- [x] `git status` is clean
