<div align="center">

# qoder-worker

**让任意宿主 AI Agent（Claude Code、Antigravity、Cursor、Gemini CLI 等）干净、可控地将编码任务与异构模型审查委派给本地 Qoder CLI（`qodercli`）。**

*预分配 UUID 精准续跑 · stdout/stderr 干净分离 · 日常快跑 + 审查顶配高低分流 · 多 Worktree 单层并行 · 零第三方依赖。*

<p>
  <img src="https://img.shields.io/badge/Skill-Agent%20Skills%20Standard-2563EB?style=flat-square" alt="Agent Skills Standard">
  <img src="https://img.shields.io/badge/Worker-Qoder%20CLI-10B981?style=flat-square" alt="Qoder CLI">
  <img src="https://img.shields.io/badge/Dependencies-Zero-0EA5E9?style=flat-square" alt="Zero Dependencies">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-64748B?style=flat-square" alt="MIT License"></a>
</p>

<p>
  <strong>简体中文</strong> · <a href="README.en.md">English</a>
</p>

</div>

---

## 为什么需要 `qoder-worker`？

在 Claude Code、Antigravity 或 Codex 里引入 `qodercli` 作为独立执行器或异构第二视角评审时，直接拼命令很容易踩坑：

| 直接调用 `qodercli` 的痛点 | `qoder-worker` 的做法 |
| :--- | :--- |
| 进度日志刷满宿主上下文，或搞混 `-p` 模式的输出流 | **stdout/stderr 分流**：`-p` 模式下 stdout 仅输出最终答复至 `$d/out.md`，进度与报错进 `$d/run.log`，宿主只读最终报告 |
| 并发跑多个任务时靠 `-c`（`--continue`）续跑极易串会话 | **预分配小写 UUID**：通过 `--session-id "$sid"` 提前锁定会话 ID，后续精准 `-r "$sid"` 续跑或 `--fork-session` 分叉 |
| 继承全局 MCP 和重型办公插件导致启动慢、环境脏 | **环境最小化**：固定 `--strict-mcp-config --setting-sources local`，跳过全局 MCP/重型插件的同时保留 CLI 登录鉴权 |
| 传错模型名不会报错而是静默回退到 `auto` | **精确模型 ID 核对 + 高低分流**：日常默认 `DeepSeek-Flash` 快跑，方案/代码 Review 默认 `Ultimate`，不确定时用 `qodercli --list-models` 核对精确拼写 |
| 超时后重复起写入进程或并发污染主工作区 | **超时不双写 + 外部 Worktree 隔离**：超时先查后台进程生死；多流并行由宿主在主仓库外切分 `git worktree` |

---

## 安装

前提：本机已安装并登录 `qodercli`。

### 通过 Skills CLI 安装（推荐）

```bash
npx -y skills add tt-a1i/qoder-worker
```

可按需指定全局安装或目标 Agent：

```bash
# 全局安装到所有已检测 Agent
npx -y skills add tt-a1i/qoder-worker -g

# 仅安装到 Claude Code
npx -y skills add tt-a1i/qoder-worker -g -a claude-code
```

### 手动安装

克隆仓库并将目录软链到你的 Agent Skills 目录（例如 `~/.claude/skills/qoder-worker` 或 `~/.gemini/config/skills/qoder-worker`）。

---

## 核心工作流

### 1. 日常快跑 + 审查顶配的高低分流
- **日常执行 / 续跑修复**：默认 `-m "${model:-DeepSeek-Flash}"` + `--reasoning-effort "${effort:-high}"`，速度快、成本低，覆盖绝大多数迭代修改与测试闭环。
- **方案/架构批判 & 独立代码 Review**：默认 `-m "${review_model:-Ultimate}"` + `--reasoning-effort high`，在全新只读 `-p` 会话中对照真实代码库或 `git diff "$base"...HEAD` 挑刺。
- **异构模型第二视角**：也可随时指定 `DeepSeek-V4-Pro`、`Qwen4-Max`、`Kimi-K3.1-Pro`、`GLM-5.3`、`Sonus` 等模型做跨家族交叉复审。

### 2. 精准续跑与分叉
- 继续同一任务或修复刚收到的 Review 发现：`-r "$sid"`
- 基于一次昂贵的调研结果并行尝试两条路线：`-r "$sid" --fork-session`（配合独立 `git worktree`）
- 独立任务或独立评审：直接新起全新 `-p` 会话，避免把旧上下文反复计费

---

## 模型核对说明

`qodercli` 对未识别的模型名会静默回退到 `auto`。不同账号权限与版本下可用模型 ID 可能变化，使用前建议先核对本机列表：

```bash
qodercli --list-models
```

---

## 安全与权限边界

本 Skill 面向**用户本机可信仓库**的非交互自动化执行，默认命令包含 `--dangerously-skip-permissions` 以免后台任务阻塞在审批提示上。

- **处理不可信仓库**或希望保留交互式工具审批时，请移除 `--dangerously-skip-permissions`。
- 始终在 Prompt 中明确工作区路径、只读/可写意图与 git 停靠点，避免误碰无关分支或共享主干。

---

## 相关项目

- [**codex-worker**](https://github.com/tt-a1i/codex-worker)：同架构的 Codex CLI 委派 Skill，与 `qoder-worker` 互补形成双 CLI 异构协作。
- [**pickup**](https://github.com/tt-a1i/pickup)：跨工具、跨目录查找与分级阅读本地 AI Agent 会话历史。

---

## 协议

[MIT](LICENSE)
