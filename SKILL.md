---
name: qoder-worker
description: >-
  Delegate repository implementation, debugging, plan/architecture critique, or
  independent code review to the local Qoder CLI (`qodercli`) from any host
  agent (Claude Code, Antigravity, etc.). Use when the user asks for Qoder or
  wants a second-opinion worker (DeepSeek, Qwen, Kimi, GLM, etc.) for iterative
  edit-verify loops, parallel git worktrees, or plan/diff review.
---

# Qoder Worker

## 1. Delegation & First-Use Confirmation

- **When to delegate**: use `qodercli` for iterative edit-test-fix loops, batch PR/review remediation, parallel `git worktree` streams, or independent plan critique / code review (especially for heterogeneous model cross-review). Edit directly when scope and fix are trivial; run known slow build/test commands directly in the host instead of spinning up a worker.
- **First-use confirmation (once per session)**:
  - If **proposing** Qoder yourself, confirm in one line: model (example defaults: `DeepSeek-Flash` for routine tasks; `Ultimate` for plan/architecture critique or code review; other exact IDs from `qodercli --list-models` may include `DeepSeek-V4-Pro`, `Qwen4-Max`, `Kimi-K3.1-Pro`, `GLM-5.3`, `Sonus` — verify availability on the user's account with `qodercli --list-models`) and `--reasoning-effort` (default `high`). "ok / 可以" accepts defaults.
  - If the **user already asked for Qoder**, apply any options they named plus defaults without a questionnaire (verify exact model spelling via `qodercli --list-models` if unsure, since unknown model names silently fall back to `auto`). Reuse agreed settings across the session.
- **Default runtime flags (trusted local repos only)**: pass `-p` (non-interactive print mode), `--dangerously-skip-permissions` (no approval prompts; omit for untrusted repos or when interactive/tool approvals are desired), `--strict-mcp-config`, and `--setting-sources local` (skips global MCPs and heavy user plugins while keeping browser/CLI auth; omit only if a user MCP/plugin is explicitly needed).

## 2. Core Commands

Isolate every run in `d=$(mktemp -d /tmp/qoder.XXXXXX)`. In `-p` mode, `qodercli` prints **only** the final assistant reply to stdout—redirect stdout to `"$d/out.md"` and stderr to `"$d/run.log"` so verbose progress never floods the host's context window. After exit `0`, read `"$d/out.md"` (inspect `"$d/run.log"` only on failure).

### Execute Task
Pre-assign a lowercase UUID via `--session-id` so follow-ups never have to scrape logs or rely on `-c` (`--continue`):
```bash
d=$(mktemp -d /tmp/qoder.XXXXXX)
sid=$( (uuidgen 2>/dev/null || python3 -c 'import uuid; print(uuid.uuid4())') | tr '[:upper:]' '[:lower:]' )
qodercli -p -w "$repo" --dangerously-skip-permissions --strict-mcp-config --setting-sources local \
  -m "${model:-DeepSeek-Flash}" --reasoning-effort "${effort:-high}" --session-id "$sid" \
  > "$d/out.md" 2> "$d/run.log" <<'EOF'
<goal, known repro/errors/paths from host, and expected git stopping point>
EOF
```

### Optional: Independent Review & Resume
`qodercli` has no dedicated diff-review subcommand—use a fresh `-p` session in read-only prompt mode for both **plan critique** and **code diff review**:
```bash
# Fresh plan or diff review (defaults to `Ultimate`; instruct Qoder not to edit files and to inspect `git diff "$base"...HEAD` or real codebase):
qodercli -p -w "$repo" --dangerously-skip-permissions --strict-mcp-config --setting-sources local \
  -m "${review_model:-Ultimate}" --reasoning-effort high \
  > "$d/review.md" 2> "$d/review.log" <<EOF
Read-only review (do not modify files): inspect git diff ${base}...HEAD and report real bugs, regressions, or missing edge cases.
EOF

# Resume original session (`-r "$sid"`; add `--fork-session` to branch off into a new session):
qodercli -p -w "$repo" --dangerously-skip-permissions --strict-mcp-config --setting-sources local \
  -m "${model:-DeepSeek-Flash}" --reasoning-effort "${effort:-high}" -r "$sid" \
  > "$d/fix.md" 2> "$d/fix.log" <<'EOF'
<verified findings to fix and re-test>
EOF
```

## 3. High-Leverage Guardrails

- **Session reuse (`-r` vs. `--fork-session` vs. fresh run)**: `-r "$sid"` when continuing the same task whose prior investigation still holds (tell Qoder to re-read files if edited externally). Add `--fork-session` (in separate worktrees if editing) to branch two approaches off one investigation. Start a **fresh run** for independent tasks, independent reviews, or whenever a short handoff beats re-sending a bloated transcript on every step.
- **Context handoff & flexible git boundary**: a fresh run cannot see host chat history—pass failing commands, key errors, relevant paths, and ruled-out causes so the worker doesn't re-investigate, let it read repo docs itself, require one-shot non-interactive test commands (e.g., `vitest run`), and state where to stop (uncommitted diff vs. branch commit vs. PR).
- **Timeout != exited (never double-write)**: if a host wait times out, check whether the background process/task is still alive before acting. Never launch a second full-access worker in the same directory while the first is still running; once exited, inspect `git status`/`diff` and decide whether to `-r "$sid"` or retry.
- **Single-layer parallelism & worktrees**: when running parallel streams, the host splits `git worktree` checkouts **outside** the main repo root. Group changes that touch shared generated artifacts (bundles, archives, lockfiles) into one batch; after landing an earlier batch, rebase the next batch, **rebuild shared artifacts, and re-run affected tests** before landing, then remove temporary worktrees and `$d` dirs.
