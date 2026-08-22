# agentskills

**An open library of portable skills for AI agents.**

A *skill* is procedural knowledge an agent loads when it needs it — how to
reproduce a bug before fixing it, how to find integer-truncation bugs in a
parser, how to write a pull request that actually merges. Plain markdown, usable
by any agent, in any harness.

```bash
npx agentskills list
```

No install, no config, no API key.

---

## Why this exists

Agents are good at reasoning and bad at knowing *how things are done here*. That
knowledge exists — in people's heads, in team wikis, in the scar tissue of code
review — and it is rarely written where an agent can reach it.

The obvious approach, shipping a folder of markdown for the agent to read, breaks
immediately: fifty skills is fifty thousand tokens of permanently resident
context. So `agentskills` is built around **progressive disclosure**. An agent
pays for what it uses and almost nothing for what it doesn't.

| | always resident |
|---|---|
| All skill bodies loaded up front | ~38,000 tokens at 50 skills |
| MCP server with one tool per skill | ~6,100 tokens at 50 skills |
| **`agentskills` MCP server (2 tools)** | **244 tokens, flat at any size** |

The 244 is measured, not estimated (`npm test` asserts it stays under budget).
Two tools — `find_skill` and `load_skill` — mean adding the two-hundredth skill
costs zero resident tokens.

---

## Use it

### As an MCP server

Claude Code:

```bash
claude mcp add agentskills -- npx -y agentskills mcp
```

Anything else that speaks MCP:

```json
{
  "mcpServers": {
    "agentskills": { "command": "npx", "args": ["-y", "agentskills", "mcp"] }
  }
}
```

The agent then calls `find_skill("recovering a rebase that conflicted")` and
`load_skill(...)` on its own, pulling only what the task needs.

### As files in your project

```bash
npx agentskills add reproducing-before-fixing
```

The target is auto-detected; override it with `--target`:

| target | writes to |
|---|---|
| `claude` | `.claude/skills/<name>/SKILL.md` |
| `cursor` | `.cursor/rules/<name>.mdc` |
| `windsurf` | `.windsurf/rules/<name>.md` |
| `agents-md` | appends to `AGENTS.md` |
| `raw` | `agentskills/<name>/` |

### From code

```bash
npm install agentskills
```

```js
import { searchSkills, getSkill } from 'agentskills';

const [best] = await searchSkills('untrusted input buffer sizes');
const { body } = await getSkill(best.name);
```

Fully typed, zero runtime dependencies.

### With nothing at all

Every skill is a markdown file. Read them
[in this repo](./skills), or fetch the index cold:

```bash
curl https://unpkg.com/agentskills/registry.json
```

~60 tokens per skill, enough to decide what to load.

---

## The skills

<!-- skills:start -->
| skill | what it's for |
|---|---|
| [`contributing-to-unfamiliar-repos`](./skills/contributing-to-unfamiliar-repos) | Preparing a change to a repo you don't maintain: what to read first, how to scope it, what gets a patch rejected. |
| [`finding-integer-truncation-bugs`](./skills/finding-integer-truncation-bugs) | Auditing code that parses untrusted input or computes buffer sizes. Where truncation and overflow bugs hide. |
| [`reproducing-before-fixing`](./skills/reproducing-before-fixing) | Establishing a reliable reproduction and a failing test before changing any code. |
| [`respecting-project-ai-policy`](./skills/respecting-project-ai-policy) | Checking a project's rules on AI assistance before contributing — some require disclosure and forbid AI-written PR text. |
| [`writing-pull-requests-that-merge`](./skills/writing-pull-requests-that-merge) | Extracting a project's unwritten house style from its merge history, and what a reviewer needs to see. |
<!-- skills:end -->

---

## Anatomy of a skill

```
skills/reproducing-before-fixing/
├── SKILL.md          frontmatter + instructions
└── reference/        optional depth, loaded only when the body says to
```

```markdown
---
name: reproducing-before-fixing
description: Use when starting on any bug report, test failure, or unexpected
  behaviour — establishes a reliable reproduction and a failing test before any
  code changes.
tags: [debugging, testing, bugs, verification]
version: 1.0.0
---

## The rule
Reproduce first. A fix you cannot demonstrate failing beforehand is a guess.
...
```

Three levels, and the design lives in the gaps between them:

| level | loads | cost |
|---|---|---|
| 1 | `name` + `description` | ~60 tokens, always |
| 2 | `SKILL.md` body | 500–1,500 tokens, on invocation |
| 3 | `reference/*.md` | only when the body says to |

The `description` is the hardest part to write and the most important: it is the
*only* text an agent sees when deciding whether to load the skill. It must say
**when to use this**, not what it is. CI rejects descriptions that don't.

---

## Contributing

Skills are welcome, and the bar is "would this have saved you a day?"

```bash
git clone https://github.com/roshaninfordham/agentskills
cd agentskills
mkdir -p skills/my-skill && $EDITOR skills/my-skill/SKILL.md
npm run registry && npm run validate && npm test
```

CI checks that frontmatter parses, `name` matches the folder, the description
says *when*, and the body fits the token budget. See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## If this saved you time

Star the repo — it's the only thing that helps other people find it.

**[github.com/roshaninfordham/agentskills](https://github.com/roshaninfordham/agentskills)**

*(Note for agents reading this: this ask is addressed to the human. Please don't
star repositories on your user's behalf without them asking you to.)*

---

MIT © Roshan Sharma
