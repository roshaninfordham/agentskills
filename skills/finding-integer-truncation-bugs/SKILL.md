---
name: finding-integer-truncation-bugs
description: Use when auditing or reviewing code that parses untrusted input,
  computes buffer sizes, or converts between integer widths — finds the
  truncation and overflow bugs that turn into heap corruption, and shows where
  they hide.
tags: [security, memory-safety, c, cpp, rust, parsing, code-review, overflow]
version: 1.0.0
---

## The rule

> When one quantity is represented in two widths or two units, and each is
> validated separately, an attacker's job is to make them disagree.

This single sentence explains a large share of parser CVEs. Most such bugs are
not one mistake; they are two individually harmless mistakes that meet.

## Where to look

**1. Narrowing casts on input-derived values.**
Any `uint64_t` from a file or socket assigned to an `int`, `int32_t`, `size_t`
on a 32-bit target, or a domain type that is secretly 32-bit. Find the type
definition; do not assume from the name.

**2. The same quantity computed twice.**
The classic shape: an allocation sized by one expression and a loop bounded by
another. They must be the same expression, or a comment must explain why they
cannot diverge.

```c
buf = malloc(count_a * size);
for (i = 0; i < count_b; i++) buf[i] = ...;   // count_b == count_a?
```

**3. Two units for one thing.**
Bytes versus elements, blocks versus rows, entries versus bytes. If validation
checks one unit, the other is unguarded.

**4. Accumulators that infer their own type.**
In C++, `std::accumulate` takes its accumulator type from `init`, not from the
operation:

```cpp
std::accumulate(v.begin(), v.end(), 1, std::multiplies<size_t>());
//                                  ^ int. Every product truncates to 32 bits.
std::accumulate(v.begin(), v.end(), size_t{1}, std::multiplies<size_t>());
```

The correct-looking `std::multiplies<size_t>` is what makes this survive review.

**5. Arithmetic before the bounds check.**
`if (offset + len > size)` wraps. Write `if (len > size - offset)` after
checking `offset <= size`.

**6. Products of several dimensions.**
Even values individually within range multiply out of range. Eight dimensions
each below 2³¹ overflow a 64-bit product easily.

## How to check a candidate

1. Find the type of every variable in the chain. Write the widths down.
2. Ask: can the attacker choose values that wrap this?
3. Ask: what else is derived from the same input, and is it validated separately?
4. Build with `-fsanitize=address,undefined` and feed it a crafted input.
5. Confirm the sanitizer fires *before* fixing anything.

## How to fix it

Fix at the point of narrowing, not at each use. Reject inputs that do not survive
the conversion, and use checked arithmetic:

```c
if (dim > INT32_MAX) reject();
if (dim != 0 && total > UINT64_MAX / dim) reject();
total *= dim;
```

Then the invariant holds for every consumer downstream, and you do not need a
check at each one. Per-call-site checks are a signal you fixed the symptom.

## Red flags

| Thought | Reality |
|---|---|
| "There's already a bounds check" | Check *which quantity* it bounds. Bytes checked ≠ elements checked. |
| "The values are all size_t" | Verify. Domain typedefs are often 32-bit. |
| "That would need an absurd input" | Attacker-supplied input is chosen, not typical. |
| "Unsigned overflow is defined" | Defined and wrapping. Defined behaviour still corrupts your heap. |
| "One check is enough" | Two representations need one *reconciliation*, not two checks. |
