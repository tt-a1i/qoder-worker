<div align="center">

# qoder-worker

**Delegate repository implementation, debugging, plan critique, and heterogeneous second-opinion code review from any host AI agent (Claude Code, Antigravity, Cursor, Gemini CLI, etc.) to the local Qoder CLI (`qodercli`).**

*Pre-assigned UUID resume · Clean stdout/stderr split · Fast execution + high-tier review routing · Single-layer `git worktree` parallelism · Zero dependencies.*

<p>
  <img src="https://img.shields.io/badge/Skill-Agent%20Skills%20Standard-2563EB?style=flat-square" alt="Agent Skills Standard">
  <img src="https://img.shields.io/badge/Worker-Qoder%20CLI-10B981?style=flat-square" alt="Qoder CLI">
  <img src="https://img.shields.io/badge/Dependencies-Zero-0EA5E9?style=flat-square" alt="Zero Dependencies">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-64748B?style=flat-square" alt="MIT License"></a>
</p>

<p>
  <a href="README.md">简体中文</a> · <strong>English</strong>
</p>

</div>

---

## Why `qoder-worker`?

Calling `qodercli` ad hoc from another host agent runs into predictable failure modes:

| Ad-hoc `qodercli` pain points | How `qoder-worker` solves them |
| :--- | :--- |
| Progress logs bloat the host context window or mix with the final answer | **Clean stdout/stderr split**: in `-p` mode, stdout carries only the final reply (`$d/out.md`) while stderr goes to `$d/run.log` |
| Concurrent runs collide when resuming via `-c` (`--continue`) | **Pre-assigned lowercase UUIDs**: pass `--session-id "$sid"` upfront and resume cleanly with `-r "$sid"` or branch via `--fork-session` |
| Global MCPs and heavy user plugins slow down or break headless runs | **Minimal isolated runtime**: passes `--strict-mcp-config --setting-sources local` while preserving CLI auth |
| Misspelled model IDs silently fall back to `auto` | **Verified IDs + split routing**: defaults to `DeepSeek-Flash` for fast execution and `Ultimate` for plan/diff review, with `qodercli --list-models` verification |
| Host timeouts cause overlapping writers or dirty checkouts | **Timeout != exited + external worktrees**: check process liveness before retrying; isolate parallel streams in external `git worktree` paths |

---

## Installation

Prerequisite: `qodercli` installed and signed in locally.

### Via Skills CLI (recommended)

```bash
npx -y skills add tt-a1i/qoder-worker
```

Install globally or target a specific agent:

```bash
# Install globally across detected agents
npx -y skills add tt-a1i/qoder-worker -g

# Install only for Claude Code
npx -y skills add tt-a1i/qoder-worker -g -a claude-code
```

### Manual Installation

Clone this repository and symlink it into your agent's skills directory (for example `~/.claude/skills/qoder-worker` or `~/.gemini/config/skills/qoder-worker`).

---

## Core Workflows

### 1. Split Fast-Execution & High-Tier Review Routing
- **Routine execution & follow-up fixes**: defaults to `-m "${model:-DeepSeek-Flash}"` with `--reasoning-effort "${effort:-high}"` for fast edit-verify loops.
- **Plan/architecture critique & independent diff review**: defaults to `-m "${review_model:-Ultimate}"` with `--reasoning-effort high` in a fresh read-only `-p` session inspecting `git diff "$base"...HEAD` or the real codebase.
- **Heterogeneous second opinions**: also supports explicit model IDs such as `DeepSeek-V4-Pro`, `Qwen4-Max`, `Kimi-K3.1-Pro`, `GLM-5.3`, and `Sonus`.

### 2. Deterministic Resume & Fork
- Continue an existing investigation or fix verified review findings: `-r "$sid"`
- Branch two approaches from one investigation (in separate worktrees if editing): `-r "$sid" --fork-session`
- Run independent tasks or fresh reviews without paying to resend a long prior transcript: start a fresh `-p` run

---

## Model Verification

Because `qodercli` silently falls back to `auto` on unrecognized model names, verify the exact model IDs available on your account before changing defaults:

```bash
qodercli --list-models
```

---

## Security & Permission Boundaries

This skill targets **trusted local repositories** and passes `--dangerously-skip-permissions` by default so non-interactive background runs do not stall on prompts.

- For **untrusted repositories** or when interactive tool approval is preferred, remove `--dangerously-skip-permissions`.
- Always state the workspace path, read-only vs. write scope, and expected git stopping point in each worker prompt.

---

## Related

- [**codex-worker**](https://github.com/tt-a1i/codex-worker): Sister skill with the same architecture for Codex CLI (`codex`), ideal for pairing with `qoder-worker` for cross-model verification.
- [**pickup**](https://github.com/tt-a1i/pickup): Find and read local AI agent sessions across tools and directories.

---

## License

[MIT](LICENSE)
