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
 * Words that carry no signal in a task description. Dropping them keeps a
 * conversational query ("how do I write a PR that gets merged") scoring on the
 * words that matter.
 */
const STOPWORDS = new Set([
  'the', 'and', 'for', 'you', 'your', 'are', 'was', 'how', 'what', 'why', 'who',
  'when', 'get', 'gets', 'got', 'can', 'that', 'this', 'with', 'from', 'into',
  'have', 'has', 'does', 'did', 'should', 'would', 'could', 'about', 'some',
  'any', 'all', 'not', 'but', 'out', 'off', 'its', 'it', 'is', 'do', 'my', 'me',
  'need', 'want', 'help', 'make', 'made', 'use', 'using', 'am', 'be', 'to', 'of',
  'in', 'on', 'at', 'by', 'an', 'a', 'i',
]);

const words = (text) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

/**
 * Does `term` match `field`? A short term must match a whole word -- otherwise
 * "pr" hits "project", "prohibited" and "preparing" and drowns the real result.
 * Longer terms may match as a prefix, so "reproduce" finds "reproducing".
 */
function matches(term, fieldWords) {
  if (term.length <= 3) return fieldWords.includes(term);
  return fieldWords.some((w) => w.startsWith(term) || term.startsWith(w));
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
  const raw = words(String(query || ''));
  // An empty query means "show me everything". A query that is nothing but
  // stopwords carries no signal, so it matches nothing rather than everything.
  if (!raw.length) return skills.slice(0, limit);

  const search = raw.filter((t) => t.length > 1 && !STOPWORDS.has(t));
  if (!search.length) return [];

  const scored = skills.map((skill) => {
    const name = skill.name.toLowerCase();
    const nameWords = words(skill.name);
    const tagWords = words(skill.tags.join(' '));
    const descWords = words(skill.description);

    let score = 0;
    for (const term of search) {
      if (name === term) score += 40;
      else if (matches(term, nameWords)) score += 8;
      if (matches(term, tagWords)) score += 4;
      if (matches(term, descWords)) score += 2;
    }
    // Reward covering more of the query rather than hitting one word hard.
    const covered = search.filter(
      (t) => matches(t, nameWords) || matches(t, tagWords) || matches(t, descWords),
    ).length;
    score += covered * 3;

    return { skill, score };
  });

  return scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name))
    .slice(0, limit)
    .map((entry) => entry.skill);
}
