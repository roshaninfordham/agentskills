---
name: reproducing-before-fixing
description: Use when starting on any bug report, test failure, or unexpected
  behaviour — establishes a reliable reproduction and a failing test before any
  code changes, so the fix can be proven rather than assumed.
tags: [debugging, testing, bugs, verification, root-cause]
version: 1.0.0
---

## The rule

Reproduce first. A fix you cannot demonstrate failing beforehand is a guess, and
you will not know whether you fixed the bug or merely moved it.

## The sequence

**1. Reproduce it exactly as reported.**
Same inputs, same version, same flags. If the report includes a script, run
theirs before writing yours. Confirm you see what they saw — if you do not, that
gap is the first thing to understand.

**2. Reduce it.**
Strip everything not required to trigger the failure. Each removal is a
hypothesis test: if the bug survives, that part was irrelevant. You are finished
when removing anything else makes it disappear.

A small reproducer is not cosmetic. It fits in a test suite, it points at the
mechanism, and it survives refactors.

**3. Choose the sharpest instrument.**
Silent corruption needs a tool that makes it loud:

- memory errors → AddressSanitizer, Valgrind
- undefined behaviour → UBSan
- data races → ThreadSanitizer
- wrong numbers → compare against a reference implementation
- intermittent failures → run it in a loop and record the failure rate

**4. Capture the evidence verbatim.**
Save the actual trace, the actual output, the exact build command. You will need
it for the test, the PR, and to prove the fix worked. Never paraphrase output you
could paste.

**5. Write the failing test.**
Before touching the fix. Run it against unmodified code and watch it fail. A test
that has never failed proves nothing — it may not exercise the bug at all.

**6. Only now, find the root cause and fix it.**

**7. Re-run everything.**
The new test passes, and the whole suite still passes.

## Deriving a reproducer rather than copying one

When a reported reproducer is impractical — too large, too slow, needs data you
do not have — work out the constraints it must satisfy and solve for a smaller
one. List every condition the input must meet to reach the faulty path, then find
the smallest input meeting all of them.

This is worth the effort: it forces you to understand precisely *why* the bug
triggers, which is exactly what you need to fix it correctly and to answer a
reviewer.

## Red flags

| Thought | Reality |
|---|---|
| "I can see the bug in the code" | Then reproducing it will be quick. Do it. |
| "It's intermittent, can't reproduce" | Then quantify it: 3 failures in 1000 runs is a reproduction. |
| "The fix is obvious" | Obvious fixes to unreproduced bugs are how regressions get shipped. |
| "The test passes now, good" | Did it fail before? If you never checked, you learned nothing. |
| "I'll describe the output" | Paste it. Descriptions hide the detail that matters. |
| "Their repro is 1MB, close enough" | Reduce it. Small reproducers point at mechanisms. |
