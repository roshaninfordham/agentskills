#!/usr/bin/env node
/**
 * Scaffold a new skill. The blank page is the biggest barrier to contributing,
 * so this writes a valid skill with the structure already in place.
 *
 *   npm run new -- my-skill-name
 *   npm run new -- my-skill-name --author "Your Name" --tags git,debugging
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { skillsDir } from '../src/paths.js';

const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) flags[argv[i].slice(2)] = argv[++i];
  else positional.push(argv[i]);
}

const name = positional[0];
if (!name) {
  console.error(`
Usage: npm run new -- <skill-name> [--author "Name"] [--tags a,b,c]

  <skill-name>   lowercase-with-hyphens, and it should name the situation,
                 not the topic: "recovering-a-conflicted-rebase", not "git"
`);
  process.exit(1);
}

if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
  console.error(`"${name}" must be lowercase-with-hyphens, e.g. reproducing-before-fixing`);
  process.exit(1);
}

const dir = join(skillsDir, name);
try {
  await access(dir);
  console.error(`skills/${name}/ already exists.`);
  process.exit(1);
} catch {
  /* good, it is free */
}

const tags = (flags.tags || 'TODO, two-to-six, tags')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean)
  .join(', ');

const authorLine = flags.author ? `author: ${flags.author}\n` : '';

const template = `---
name: ${name}
description: Use when TODO — describe the SITUATION that should make an agent
  reach for this, then what it covers. This is the only text an agent sees when
  deciding whether to load the skill, so it must say WHEN, not what.
tags: [${tags}]
${authorLine}version: 1.0.0
---

## The rule

TODO — one or two sentences. If the reader remembers nothing else, this.

## TODO — the steps, the checks, or the sequence

1. TODO
2. TODO

Use real commands, real paths, real numbers. Concrete beats abstract every time.

## Red flags

TODO — the rationalisations someone talks themselves into, and why each is wrong.
This is usually the highest-value section in a skill: it catches the agent in the
act of skipping the rule.

| Thought | Reality |
|---|---|
| "TODO the excuse" | TODO why it does not hold |

<!-- UNFINISHED: delete this line once every TODO above is replaced. -->
`;

await mkdir(dir, { recursive: true });
await writeFile(join(dir, 'SKILL.md'), template);

console.log(`
Created skills/${name}/SKILL.md

  1. Replace every TODO, then delete the UNFINISHED line at the bottom
  2. npm run registry
  3. npm run validate && npm test

The description is the hard part. Write it as "Use when <situation>" and it will
usually come out right.
`);
