---
name: respecting-project-ai-policy
description: Use when contributing code to a project that may have rules about AI
  assistance — check before writing, since some projects require disclosure and
  forbid AI-written pull request text, with bans as the stated penalty.
tags: [open-source, ai-policy, disclosure, ethics, pull-request, contributing]
version: 1.0.0
---

## The rule

Check the project's AI policy **before** writing anything, and follow it exactly.
Policies vary in both directions, and guessing wrong is expensive.

## Find the policy first

```
grep -ril "ai\|llm\|generated" CONTRIBUTING.md AGENTS.md CLAUDE.md \
  .github/pull_request_template.md 2>/dev/null
```

Read every hit. Record what you find before starting work.

## The four policies you will meet

| Policy | What it means in practice |
|---|---|
| **Silent** | No stated rule. Ordinary care applies; disclosure is optional. |
| **Disclosure required** | AI-assisted code is welcome, but you must state how AI was used. Concealment is the violation, not the assistance. |
| **Posts prohibited** | AI may write code but must not write PR descriptions, issue reports, or replies to humans. Often paired with disclosure. |
| **Prohibited outright** | No AI-assisted contributions. Do not submit one. |

The second and third routinely appear together, and they are **separate**
requirements. Disclosing that AI was used does not license AI to write the prose.

## What this means for an agent

When a project prohibits AI-written posts:

- **Do not** draft the PR description, issue text, commit message, or any reply
  to a reviewer, even as "a draft the human will rephrase". The human is
  typically asked to tick a box attesting the text is not AI-written; producing
  it makes that attestation false.
- **Do not** push branches or open the PR on the human's behalf if the project
  says not to.
- **Do** everything else: investigate, reproduce, write the code and the tests,
  run the suite, gather evidence.
- **Do** hand over an organised record of facts — traces, counts, file:line
  references, decisions and their rationale — so the human can write accurately
  and quickly from material they understand.
- **Do** offer to check their draft for factual accuracy. Editing their words is
  not writing them.

There is a real reason behind the rule, and it is worth stating to the human:
review is a conversation. Whoever submits the PR has to answer the reviewer's
questions themselves, on a clock, without help. Ghostwriting the description does
not remove that problem, it relocates it to somewhere harder.

## Writing a disclosure

Be specific about *what* AI did and affirm what you personally reviewed and ran.
Naming a vendor is rarely required; describing the manner of use always is.

Good: `AI assistance was used for the investigation, the fix, and the tests; I
reviewed every changed line and ran the commands above myself.`

Bad: `Some AI was used.` — vague disclosure reads worse than none.

## Red flags

| Thought | Reality |
|---|---|
| "Disclosing covers it" | Disclosure and the no-AI-posts rule are separate. |
| "I'll write it, they'll rephrase" | Ghostwritten-then-edited is still AI-written. |
| "Nobody can tell" | The point is not detection; the attestation is still false. |
| "The rule is silly" | It is their project. Contribute elsewhere if you disagree. |
| "I'll disclose after review" | The template asks up front. Answer it up front. |
