#!/usr/bin/env node
/** Regenerate registry.json from the skills/ directory. */
import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { scanSkills } from '../src/registry.js';
import { packageRoot, registryPath } from '../src/paths.js';

const pkg = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
const skills = await scanSkills();

// No timestamp: the output must be reproducible so a rebuild with no skill
// changes produces no diff.
await writeFile(
  registryPath,
  JSON.stringify({ version: pkg.version, skills }, null, 2) + '\n',
);

const total = skills.reduce((sum, s) => sum + s.tokens, 0);
console.log(`registry.json: ${skills.length} skills, ${total} tokens of bodies`);
