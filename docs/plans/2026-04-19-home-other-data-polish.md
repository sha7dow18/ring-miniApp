# Home Other Data Polish Plan

**Goal:** Make the home page "其他数据" trends render reliably in WeChat Mini Program and polish the nearby list/card presentation without changing the page's overall visual language.
**Scope:** Replace the fragile SVG data-URI sparkline path with a native rendering approach, keep the current earthy design system, and make small user-facing layout/text refinements around the home metric rows. Explicitly out of scope: blood-pressure chart redesign, new data sources, and broad home-page restructuring.
**Architecture:** The current trend rendering depends on `<image src="data:image/svg+xml,...">`, which is brittle across Mini Program runtimes. A native WXML + WXSS micro-chart built from computed row data removes that platform risk, keeps the row component lightweight, and lets live BLE snapshots update numbers and trends through the same page-state path.
**Success criteria:** Home metric rows always render a visible micro-trend without relying on SVG image data URIs; live metric updates refresh both numbers and their micro-trends; the home page tests pass; docs index reflects the new sprint plan.

---

## Docs Impact

| File | Action | What changes |
|------|--------|-------------|
| `docs/plans/2026-04-19-home-other-data-polish.md` | Create | Record goal, scope, acceptance criteria, and task breakdown for the home metric-row polish. |
| `docs/README.md` | Update | Add this sprint plan to the docs index. |

---

## Tasks

### Task 1: Extract native home metric-row trend builder

**Files:**
- Create: `miniprogram/utils/homeMetricRows.js`
- Create: `tests/homeMetricRows.test.js`

**Steps:**
1. Write acceptance criteria in `tests/homeMetricRows.test.js` for native trend-point output and stable row content.
2. Run `npm test -- --runInBand homeMetricRows.test.js` and confirm the new test fails before implementation.
3. Implement minimal pure helpers in `miniprogram/utils/homeMetricRows.js`.
4. Re-run `npm test -- --runInBand homeMetricRows.test.js` and confirm it passes.
5. Keep docs impact unchanged for this task.
6. Commit: `refactor(home): extract native other-data row builder`

---

### Task 2: Replace SVG sparkline rendering on home page

**Files:**
- Modify: `miniprogram/pages/home/index.js`
- Modify: `miniprogram/pages/home/index.wxml`
- Modify: `miniprogram/pages/home/index.wxss`

**Steps:**
1. Write acceptance criterion in `tests/homeMetricRows.test.js` for live metric updates producing fresh trend rows.
2. Run `npm test -- --runInBand homeMetricRows.test.js` and confirm the new criterion fails first.
3. Implement the smallest page changes needed to render native micro-trends and refresh them during live updates.
4. Run `npm test -- --runInBand homeMetricRows.test.js` and confirm it passes.
5. Keep the page within the existing design-system tokens and localized page styles.
6. Commit: `fix(home): replace fragile sparkline SVG with native trend bars`

---

### Task 3: Final home-row polish and verification

**Files:**
- Modify: `miniprogram/pages/home/index.wxml`
- Modify: `miniprogram/pages/home/index.wxss`
- Modify: `docs/README.md`

**Steps:**
1. Define acceptance as: the metric rows remain readable, aligned, and visually balanced with the existing cards after the rendering swap.
2. Run `bash scripts/check-tokens.sh` and `npm test` after implementation.
3. Make only surgical layout/text refinements if the native chart swap leaves spacing or hierarchy uneven.
4. Re-run verification and confirm both commands pass.
5. Update docs index entry in `docs/README.md`.
6. Commit: `polish(home): refine other-data rows after native chart swap`

---

## Verification (Phase 5)

- [x] `npm test` passes with 0 failures
- [x] `bash scripts/check-tokens.sh` passes
- [x] Docs Impact items verified via `git diff --name-only`
- [x] `docs/README.md` updated
- [x] `git status` is clean
