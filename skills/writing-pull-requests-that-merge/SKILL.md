---
name: writing-pull-requests-that-merge
description: Use when opening a pull request on a project you do not maintain —
  covers extracting the project's house style from its merge history, and what a
  reviewer needs to see before they can say yes.
tags: [pull-request, code-review, open-source, github, communication]
version: 1.0.0
---

## The rule

Match the house style of the project you are submitting to. There is one, it is
never written down, and it is recoverable in ten minutes from merged PRs.

## Extract the style first

```
gh pr list --repo OWNER/REPO --state merged --limit 30 \
  --json number,title,author,additions,deletions
gh pr view NUMBER --repo OWNER/REPO --json title,body
```

Read three to five merged PRs in the area you are changing, plus two closed ones.
Record: title grammar, section headings (or none), whether real output is pasted,
whether `file:line` is cited, typical length, and how related work is referenced.

Closed PRs teach faster than merged ones. The maintainer's rejection sentence is
usually the rule they never wrote down.

## What a reviewer needs

A reviewer says yes when they can answer four questions without asking:

1. **What was wrong?** The mechanism, with `file:line`, quoting the actual code.
2. **How do I know?** Real output — a trace, a session transcript, an error.
   Before and after. Never a description of output you could paste.
3. **Why this fix?** Especially: why not the other obvious one. If you considered
   an alternative and rejected it, say which and why.
4. **How do I know it works?** Real commands, real counts, and confirmation that
   the new test fails without the change.

Two more that turn a good PR into an easy one:

- **Prior art.** Name related PRs, issues, or CVEs and say how yours differs.
  This is how you prove you searched before writing.
- **Scope.** State what you deliberately did *not* fix, and why. Volunteering
  this reads as judgment. Being caught omitting it reads as carelessness.

## Titles

Imperative, specific, naming the mechanism. Aim for 45–65 characters.

```
Bound GGUF tensor data offsets against the file mapping
Fix int32 overflow in concatenate/repeat/kron
Clamp ring socket transfers so a payload of 2 GiB or more can be sent
```

Not `Fix bug`, not `Security fix`, not `Update parser`. If the project
squash-merges, this title becomes the permanent commit subject — check whether
recent subjects carry a `(#NNNN)` suffix, and if so do not add one yourself.

## Before you submit

- The template is filled in, every box answered honestly.
- No placeholder or scaffold text survives anywhere in the body. Search for `[`
  and `TODO` before sending.
- The branch is pushed and matches your local commit.
- Nobody else has claimed the issue or opened a competing PR.
- Formatter and full test suite run, with the output quoted.

## Red flags

| Thought | Reality |
|---|---|
| "I'll describe the failure" | Paste it. Descriptions omit the detail reviewers need. |
| "The diff explains itself" | The diff shows what. Reviewers need why. |
| "I'll mention the alternative if asked" | Answer it first; being asked costs a round trip. |
| "Longer is more thorough" | Match the project's length. Some merge on three sentences. |
| "I'll tidy the PR text later" | There is no later. It is read once, on arrival. |
