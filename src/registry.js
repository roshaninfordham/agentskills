import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { parseFrontmatter, estimateTokens } from './frontmatter.js';
import { registryPath, skillsDir } from './paths.js';

let cached = null;

/**
 * Read the generated registry. Falls back to scanning skills/ so the package
 * still works from a checkout where registry.json has not been built yet.
 * @returns {Promise<import('./index.d.ts').Registry>}
 */
export async function loadRegistry() {
  if (cached) return cached;
  try {
    cached = JSON.parse(await readFile(registryPath, 'utf8'));
  } catch {
    cached = { version: '0.0.0', skills: await scanSkills() };
  }
  return cached;
}

/**
 * Build the index by reading every skill folder. This is the source of truth;
 * registry.json is only a cached copy of it.
 * @returns {Promise<import('./index.d.ts').SkillMeta[]>}
 */
export async function scanSkills() {
  let entries;
  try {
    entries = await readdir(skillsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const skills = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const skill = await readSkillMeta(entry.name);
    if (skill) skills.push(skill);
  }
  return skills;
}

async function readSkillMeta(folder) {
  const path = join(skillsDir, folder, 'SKILL.md');
  let source;
  try {
    source = await readFile(path, 'utf8');
  } catch {
    return null;
  }

  const { data, body } = parseFrontmatter(source);
  return {
    name: data.name || folder,
    description: data.description || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    folder,
    path: `skills/${folder}/SKILL.md`,
    tokens: estimateTokens(body),
    references: await listReferences(folder),
  };
}

async function listReferences(folder) {
  const dir = join(skillsDir, folder, 'reference');
  try {
    if (!(await stat(dir)).isDirectory()) return [];
    const files = await readdir(dir);
    return files.filter((f) => f.endsWith('.md')).sort();
  } catch {
    return [];
  }
}

/**
 * Rank skills against a free-text query. Scoring favours an exact name, then
 * tags, then description matches, so "rebase conflict" finds a git skill whose
 * name never says "rebase".
 * @param {string} query
 * @param {number} [limit]
 * @returns {Promise<import('./index.d.ts').SkillMeta[]>}
 */
export async function searchSkills(query, limit = 10) {
  const { skills } = await loadRegistry();
  const terms = String(query || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);

  if (!terms.length) return skills.slice(0, limit);

  const scored = skills.map((skill) => {
    const name = skill.name.toLowerCase();
    const tags = skill.tags.join(' ').toLowerCase();
    const description = skill.description.toLowerCase();

    let score = 0;
    for (const term of terms) {
      if (name === term) score += 20;
      else if (name.includes(term)) score += 8;
      if (tags.includes(term)) score += 4;
      if (description.includes(term)) score += 2;
    }
    return { skill, score };
  });

  return scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name))
    .slice(0, limit)
    .map((entry) => entry.skill);
}
