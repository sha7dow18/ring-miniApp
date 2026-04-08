# Repository Cleanup Plan

## Goal
Restructure the ring-miniApp repository from a messy state (zip files, nested Chinese directories, dead code) into a clean, standard WeChat miniprogram GitHub repository.

## Scope
- Adopt the "有商城页面" superset as the canonical codebase
- Flatten `项目文件夹/` nesting — project files go to repo root
- Remove all junk: zip, `_archive/`, utility `.py` scripts, backup configs
- Add GitHub standards: `.gitignore`, `README.md`
- No business logic changes. No git history rewrite.

## Success Criteria
1. `miniprogram/` and `project.config.json` live at repo root (standard wx structure)
2. No binary blobs (zip) in tracked files
3. No dead code (`_archive/`, `.py` scripts)
4. `.gitignore` covers `node_modules/`, `miniprogram_npm/`, `project.private.config.json`, etc.
5. `README.md` describes the project
6. WeChat DevTools can open the project directly from repo root

## Tasks
1. Remove all current tracked files in worktree
2. Copy flattened superset content to worktree root
3. Delete `_archive/`, `append_ai.py`, `write_ai.py`, `tsconfig.backup.json`, `project.private.config.json`
4. Create `.gitignore`
5. Create `README.md`
6. Verify `project.config.json` paths are correct for root-level structure
7. Commit, verify, squash merge, push
