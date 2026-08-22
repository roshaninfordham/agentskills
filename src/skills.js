import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseFrontmatter } from './frontmatter.js';
import { skillsDir } from './paths.js';
import { loadRegistry } from './registry.js';

/**
 * Load one skill in full: frontmatter, body, and the raw file.
 * @param {string} name
 * @returns {Promise<import('./index.d.ts').Skill>}
 */
export async function getSkill(name) {
  const meta = await findMeta(name);
  const source = await readFile(join(skillsDir, meta.folder, 'SKILL.md'), 'utf8');
  const { body } = parseFrontmatter(source);
  return { ...meta, body, source };
}

/**
 * Load one of a skill's reference documents. These are level three: an agent
 * pulls them only when the skill body says to.
 * @param {string} name
 * @param {string} file
 * @returns {Promise<string>}
 */
export async function getReference(name, file) {
  const meta = await findMeta(name);
  const safe = file.replace(/^.*[\\/]/, '');
  if (!meta.references.includes(safe)) {
    throw new Error(
      `Skill "${meta.name}" has no reference "${safe}". Available: ${
        meta.references.join(', ') || 'none'
      }`,
    );
  }
  return readFile(join(skillsDir, meta.folder, 'reference', safe), 'utf8');
}

async function findMeta(name) {
  const { skills } = await loadRegistry();
  const wanted = String(name || '').trim().toLowerCase();
  const meta = skills.find(
    (s) => s.name.toLowerCase() === wanted || s.folder.toLowerCase() === wanted,
  );
  if (!meta) {
    throw new Error(
      `Unknown skill "${name}". Run "agentskills list" to see what is available.`,
    );
  }
  return meta;
}
