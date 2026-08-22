import { mkdir, writeFile, readFile, appendFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { getSkill, getReference } from './skills.js';

/**
 * Where each agent harness expects skill files to live. Adding support for a
 * new harness means adding an entry here and nothing else.
 * @type {Record<string, { label: string, detect: string[], write: Function }>}
 */
export const TARGETS = {
  claude: {
    label: 'Claude Code / Claude Desktop',
    detect: ['.claude'],
    write: async (skill, cwd) => {
      const dir = join(cwd, '.claude', 'skills', skill.name);
      await writeSkillFolder(skill, dir);
      return [join('.claude', 'skills', skill.name, 'SKILL.md')];
    },
  },

  cursor: {
    label: 'Cursor',
    detect: ['.cursor'],
    write: async (skill, cwd) => {
      const file = join(cwd, '.cursor', 'rules', `${skill.name}.mdc`);
      const front = [
        '---',
        `description: ${skill.description}`,
        'alwaysApply: false',
        '---',
        '',
      ].join('\n');
      await writeFileEnsured(file, front + skill.body + '\n');
      return [join('.cursor', 'rules', `${skill.name}.mdc`)];
    },
  },

  windsurf: {
    label: 'Windsurf',
    detect: ['.windsurf'],
    write: async (skill, cwd) => {
      const file = join(cwd, '.windsurf', 'rules', `${skill.name}.md`);
      await writeFileEnsured(file, skill.body + '\n');
      return [join('.windsurf', 'rules', `${skill.name}.md`)];
    },
  },

  'agents-md': {
    label: 'AGENTS.md (Codex, Jules, and anything reading AGENTS.md)',
    detect: ['AGENTS.md'],
    write: async (skill, cwd) => {
      const file = join(cwd, 'AGENTS.md');
      const marker = `<!-- agentskills:${skill.name} -->`;
      let existing = '';
      try {
        existing = await readFile(file, 'utf8');
      } catch {
        /* first skill in a new file */
      }
      if (existing.includes(marker)) {
        throw new Error(`AGENTS.md already contains "${skill.name}".`);
      }
      const block = [
        '',
        marker,
        `## ${skill.name}`,
        '',
        `> ${skill.description}`,
        '',
        skill.body,
        `<!-- /agentskills:${skill.name} -->`,
        '',
      ].join('\n');
      await appendFile(file, block);
      return ['AGENTS.md'];
    },
  },

  raw: {
    label: 'Plain markdown in ./agentskills/',
    detect: [],
    write: async (skill, cwd) => {
      const dir = join(cwd, 'agentskills', skill.name);
      await writeSkillFolder(skill, dir);
      return [join('agentskills', skill.name, 'SKILL.md')];
    },
  },
};

/**
 * Guess the harness from what is already in the project. Falls back to raw so
 * the command always does something useful.
 * @param {string} cwd
 * @returns {Promise<string>}
 */
export async function detectTarget(cwd) {
  for (const [name, target] of Object.entries(TARGETS)) {
    for (const marker of target.detect) {
      try {
        await access(join(cwd, marker));
        return name;
      } catch {
        /* not this one */
      }
    }
  }
  return 'raw';
}

/**
 * Install a skill into a project in the layout its harness expects.
 * @param {string} name
 * @param {{ target?: string, cwd?: string }} [options]
 * @returns {Promise<{ target: string, files: string[] }>}
 */
export async function installSkill(name, options = {}) {
  const cwd = options.cwd || process.cwd();
  const target = options.target || (await detectTarget(cwd));
  const spec = TARGETS[target];
  if (!spec) {
    throw new Error(
      `Unknown target "${target}". Choose from: ${Object.keys(TARGETS).join(', ')}`,
    );
  }
  const skill = await getSkill(name);
  return { target, files: await spec.write(skill, cwd) };
}

async function writeSkillFolder(skill, dir) {
  await writeFileEnsured(join(dir, 'SKILL.md'), skill.source);
  for (const file of skill.references) {
    await writeFileEnsured(
      join(dir, 'reference', file),
      await getReference(skill.name, file),
    );
  }
}

async function writeFileEnsured(file, contents) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, contents);
}
