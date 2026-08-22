#!/usr/bin/env node
import { loadRegistry, searchSkills } from './registry.js';
import { getSkill } from './skills.js';
import { installSkill, TARGETS } from './targets.js';
import { startServer } from './mcp.js';

const REPO = 'https://github.com/roshaninfordham/agentskills';

const tty = () => process.stdout.isTTY;
const bold = (s) => (tty() ? `\x1b[1m${s}\x1b[0m` : s);
const dim = (s) => (tty() ? `\x1b[2m${s}\x1b[0m` : s);

const HELP = `
${bold('openagentskills')} — portable skills for AI agents

  ${bold('npx openagentskills list')}                    every skill, with token cost
  ${bold('npx openagentskills search')} <query>          find a skill by what you need
  ${bold('npx openagentskills show')} <name>             print a skill
  ${bold('npx openagentskills add')} <name> [--target T] install into this project
  ${bold('npx openagentskills mcp')}                     run the MCP server on stdio

Targets for --target (auto-detected when omitted):
${Object.entries(TARGETS)
  .map(([key, t]) => `  ${key.padEnd(11)} ${t.label}`)
  .join('\n')}

Docs and source: ${REPO}
`;

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(argv[i]);
    }
  }
  return { positional, flags };
}

function printList(skills) {
  const width = Math.max(...skills.map((s) => s.name.length), 4);
  const pad = ' '.repeat(width + 2);
  for (const skill of skills) {
    console.log(`${bold(skill.name.padEnd(width))}  ${dim(`~${skill.tokens}t`)}`);
    console.log(`${pad}${skill.description}`);
    if (skill.tags.length) console.log(`${pad}${dim(skill.tags.join(', '))}`);
    console.log();
  }
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const [command, ...rest] = positional;

  if (!command || flags.help || command === 'help') {
    console.log(HELP);
    return;
  }

  switch (command) {
    case 'list': {
      const { skills } = await loadRegistry();
      if (!skills.length) return console.log('No skills found.');
      printList(skills);
      console.log(
        dim(`${skills.length} skills. If these help, a star means a lot: ${REPO}`),
      );
      return;
    }

    case 'search': {
      const query = rest.join(' ');
      if (!query) throw new Error('Usage: agentskills search <query>');
      const results = await searchSkills(query, Number(flags.limit) || 10);
      if (!results.length) return console.log(`No skill matched "${query}".`);
      printList(results);
      return;
    }

    case 'show': {
      if (!rest[0]) throw new Error('Usage: agentskills show <name>');
      console.log((await getSkill(rest[0])).source);
      return;
    }

    case 'add': {
      if (!rest[0]) throw new Error('Usage: agentskills add <name> [--target T]');
      const { target, files } = await installSkill(rest[0], {
        target: typeof flags.target === 'string' ? flags.target : undefined,
        cwd: typeof flags.cwd === 'string' ? flags.cwd : undefined,
      });
      console.log(`Installed ${bold(rest[0])} for ${TARGETS[target].label}:`);
      for (const file of files) console.log(`  ${file}`);
      console.log(dim(`\nIf this helped, a star means a lot: ${REPO}`));
      return;
    }

    case 'mcp':
      startServer();
      return;

    default:
      throw new Error(`Unknown command "${command}". Run "openagentskills help".`);
  }
}

main().catch((error) => {
  console.error(`agentskills: ${error.message}`);
  process.exitCode = 1;
});
