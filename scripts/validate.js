#!/usr/bin/env node
/**
 * Enforce the skill contract. Runs in CI on every PR, so a contributor learns
 * what is wrong before a human has to say it.
 */
import { readdir, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { parseFrontmatter, estimateTokens } from '../src/frontmatter.js';
import { skillsDir } from '../src/paths.js';

const MAX_BODY_TOKENS = 2500;
const MAX_DESCRIPTION = 500;
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const WHEN_WORDS = ['use when', 'when you', 'when a', 'when the', 'for when'];

const problems = [];
const fail = (skill, message) => problems.push(`${skill}: ${message}`);

const entries = await readdir(skillsDir, { withFileTypes: true }).catch(() => []);
const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name);

if (!folders.length) problems.push('skills/: no skills found');

const seen = new Set();

for (const folder of folders) {
  const file = join(skillsDir, folder, 'SKILL.md');
  try {
    await access(file);
  } catch {
    fail(folder, 'has no SKILL.md');
    continue;
  }

  const { data, body } = parseFrontmatter(await readFile(file, 'utf8'));
  const name = data.name;

  if (!name) fail(folder, 'frontmatter has no "name"');
  else if (name !== folder) fail(folder, `name "${name}" does not match its folder`);
  else if (!NAME_PATTERN.test(name)) fail(folder, 'name must be lowercase-kebab-case');

  if (seen.has(name)) fail(folder, `duplicate name "${name}"`);
  seen.add(name);

  const description = data.description || '';
  if (!description) {
    fail(folder, 'frontmatter has no "description"');
  } else {
    if (description.length > MAX_DESCRIPTION) {
      fail(folder, `description is ${description.length} chars, max ${MAX_DESCRIPTION}`);
    }
    const lower = description.toLowerCase();
    if (!WHEN_WORDS.some((w) => lower.includes(w))) {
      fail(
        folder,
        'description must say WHEN to use the skill (e.g. "Use when ...") — it is ' +
          'the only text an agent sees when deciding whether to load it',
      );
    }
  }

  if (data.tags && !Array.isArray(data.tags)) fail(folder, 'tags must be [a, b, c]');

  if (!body) {
    fail(folder, 'has no body');
  } else {
    const tokens = estimateTokens(body);
    if (tokens > MAX_BODY_TOKENS) {
      fail(
        folder,
        `body is ~${tokens} tokens, max ${MAX_BODY_TOKENS}. Move detail into ` +
          'reference/ so it loads only when needed',
      );
    }
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('');
  process.exit(1);
}
console.log(`All ${folders.length} skills valid.`);
