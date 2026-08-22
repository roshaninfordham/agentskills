# Contributing

Skills are the point of this project. Code changes are welcome too, but a good
skill is worth more than a good refactor here.

## What makes a good skill

The bar: **would this have saved you a day?**

A skill is procedural knowledge — the thing an experienced engineer does almost
without thinking, that an agent has no way to know. Not a tutorial, not API
documentation, not a summary of something already in the model's weights.

Good candidates:

- A workflow with a failure mode that is expensive to learn the hard way
- A checklist that experienced people follow and beginners don't know exists
- A class of bug, with the pattern that finds it
- A convention that varies by ecosystem and is never written down

Poor candidates:

- "How to use library X" — that is documentation, and it goes stale
- Anything a competent model already does reliably without instruction
- Personal preference presented as practice
- A skill so broad it applies to everything, and so says nothing

## Writing one

```bash
mkdir -p skills/my-skill
$EDITOR skills/my-skill/SKILL.md
```

```markdown
---
name: my-skill
description: Use when <the situation that should trigger this> — <what it covers>.
tags: [two, to, six, tags]
version: 1.0.0
---

## The rule

One or two sentences. The single most important thing.

## <the steps, or the checks, or the sequence>

...

## Red flags

| Thought | Reality |
|---|---|
| The rationalisation | Why it's wrong |
```

### The description is the hard part

It is the only text an agent sees when choosing whether to load your skill. It
must describe **when to use it**, not what it is.

| | |
|---|---|
| Useless | `Git workflows and best practices` |
| Useful | `Use when a rebase has conflicted and you need to recover without losing work` |

CI rejects descriptions that don't state a trigger condition.

### Keep the body small

Budget is ~2,500 tokens, and most good skills are well under 1,000. If yours is
larger, it is probably two skills, or the depth belongs in `reference/`:

```
skills/my-skill/
├── SKILL.md              the procedure
└── reference/
    └── edge-cases.md     loaded only when SKILL.md says to
```

Reference the file from the body so the agent knows when it is worth loading.

### Style

- Second person, imperative. "Read CONTRIBUTING.md first", not "one should".
- Concrete over abstract. Real commands, real file paths, real numbers.
- No hedging. If the rule has an exception, name the exception.
- A "Red flags" table of rationalisations is the highest-value section in most
  skills — it catches the agent in the act of talking itself out of the rule.

## Before you open a PR

```bash
npm run registry   # regenerate registry.json — commit the result
npm run validate   # the same checks CI runs
npm test
```

`registry.json` is generated. Never edit it by hand, and always commit it with
your skill so the package works without a build step.

## Code changes

Zero runtime dependencies is a hard constraint — it is why `npx openagentskills`
starts instantly and why the package has no supply chain. A change that adds a
dependency needs a strong argument.

Tests are `node:test`, no framework.
