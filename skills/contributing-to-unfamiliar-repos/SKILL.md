---
name: contributing-to-unfamiliar-repos
description: Use when preparing a change to a repository you do not maintain — an
  open-source contribution, a PR to another team's service, or any codebase whose
  reviewers you do not know. Covers what to read first, how to scope the change,
  and what gets a patch rejected.
tags: [open-source, code-review, git, github, collaboration, pull-request]
version: 1.0.0
---

## The rule

Read the project's rules and its recent history **before** writing code. Most
rejected patches are not wrong; they are unwelcome. The difference is knowable in
advance, and it takes about fifteen minutes to know it.

## 1. Read these, in this order

1. `CONTRIBUTING.md` — non-negotiable. It may contain policies with real teeth
   (AI usage, DCO sign-off, benchmark requirements).
2. `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/` — a repo may address agents
   directly. These override your defaults.
3. `.github/pull_request_template.md` — the form you will fill in. Read it now,
   not at submit time; it often demands evidence you must gather while working.
4. CI config — the checks that must pass. Run them locally rather than
   discovering them in a red build.

## 2. Learn what a good patch looks like *here*

Every project has a house style that no document states. Extract it from merges:

```
gh pr list --repo OWNER/REPO --state merged --limit 30 \
  --json number,title,author,additions --jq '.[] | "\(.number) \(.title)"'
gh pr view NUMBER --repo OWNER/REPO --json title,body
```

Read three to five merged PRs **in the area you are touching**, and at least two
*closed* ones. The closed ones are more informative — they tell you what the
maintainer rejects and in what words.

Note specifically: title grammar, whether bodies show real output, whether they
cite `file:line`, whether they compare against prior related PRs, and how long
they are.

## 3. Scope the change

- Fix one thing. A patch that also reformats, renames, or "improves while I was
  here" invites a request to split it, which costs a review cycle.
- Fix it at the layer where the invariant broke, not at the symptom. A check
  copied into three call sites is a signal you are patching downstream.
- If you deliberately leave something out, **say so in the PR**. Volunteering a
  scope decision reads as judgment; being caught omitting it reads as
  carelessness.

## 4. Prove it

- Reproduce the problem before changing anything. See
  `reproducing-before-fixing`.
- Write the test first and confirm it fails on the unmodified base. Many projects
  require you to state that you did.
- Run the project's own formatter, linter, and full test suite. Quote real
  output with real counts, never "tests pass".

## 5. Match the surrounding code

The diff should read as though the maintainers wrote it: same comment density,
same naming, same idioms. If the file has terse one-line comments, do not add
five-line explanations. Read the neighbouring functions before writing yours.

## 6. Submit

- Check nobody else has claimed the issue or opened a competing PR.
- Rebase onto current upstream and confirm no conflicting changes landed.
- Fill in the PR template honestly, including every checkbox.
- Keep the title imperative and specific: name the mechanism, not the symptom.

## Red flags

| Thought | Reality |
|---|---|
| "I'll read CONTRIBUTING if it's rejected" | It exists because rejections happened. |
| "The fix is obvious, I'll skip the repro" | If you cannot reproduce it, you cannot know you fixed it. |
| "I'll tidy this nearby code too" | Two changes, two arguments, one rejection. |
| "Tests pass on my machine" | Quote the counts, or you did not run them. |
| "My style is cleaner" | Consistency beats taste in someone else's repo. |
