/**
 * MCP server over stdio, speaking newline-delimited JSON-RPC 2.0.
 *
 * Two tools, deliberately. One tool per skill would put every skill's schema in
 * the model's context permanently and grow without bound; a search plus a
 * loader costs a fixed ~250 tokens no matter how large the library gets.
 */

import { searchSkills, loadRegistry } from './registry.js';
import { getSkill, getReference } from './skills.js';

const DEFAULT_PROTOCOL = '2024-11-05';

const TOOLS = [
  {
    name: 'find_skill',
    description:
      'Search the agentskills library for skills relevant to the task at hand. ' +
      'Returns names and descriptions only, not the skill contents. Call this ' +
      'first, then load_skill for whichever result fits.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'What you are trying to do, in plain words, e.g. "recover a rebase that conflicted".',
        },
        limit: { type: 'number', description: 'Maximum results. Default 10.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'load_skill',
    description:
      'Load the full instructions for one skill by name. Use the name returned ' +
      'by find_skill. Follow the loaded instructions exactly.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Skill name from find_skill.' },
        reference: {
          type: 'string',
          description:
            'Optional. Load one of the skill\'s reference documents instead of ' +
            'its body. Only use a filename the skill body told you to load.',
        },
      },
      required: ['name'],
    },
  },
];

async function callTool(name, args = {}) {
  if (name === 'find_skill') {
    const results = await searchSkills(args.query, args.limit ?? 10);
    if (!results.length) {
      const { skills } = await loadRegistry();
      return (
        `No skill matched "${args.query}". The library has ${skills.length} skills; ` +
        `try a broader query or a different wording.`
      );
    }
    return results
      .map((s) => `${s.name} (~${s.tokens} tokens)\n  ${s.description}`)
      .join('\n\n');
  }

  if (name === 'load_skill') {
    if (args.reference) return getReference(args.name, args.reference);
    const skill = await getSkill(args.name);
    const extra = skill.references.length
      ? `\n\n---\nReference documents available for this skill, load only if the ` +
        `instructions above say to: ${skill.references.join(', ')}`
      : '';
    return skill.body + extra;
  }

  throw new Error(`Unknown tool "${name}"`);
}

async function handle(message) {
  const { id, method, params } = message;
  const reply = (result) => ({ jsonrpc: '2.0', id, result });

  switch (method) {
    case 'initialize':
      return reply({
        protocolVersion: params?.protocolVersion || DEFAULT_PROTOCOL,
        capabilities: { tools: {} },
        serverInfo: { name: 'agentskills', version: (await loadRegistry()).version },
      });

    case 'tools/list':
      return reply({ tools: TOOLS });

    case 'tools/call':
      try {
        const text = await callTool(params?.name, params?.arguments);
        return reply({ content: [{ type: 'text', text }] });
      } catch (error) {
        // A tool failure is a result the model can read and recover from,
        // not a protocol error.
        return reply({
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        });
      }

    case 'ping':
      return reply({});

    default:
      if (method?.startsWith('notifications/')) return null;
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

/** Run the server until stdin closes. */
export function startServer(input = process.stdin, output = process.stdout) {
  let buffer = '';

  input.setEncoding('utf8');
  input.on('data', async (chunk) => {
    buffer += chunk;
    let newline;
    while ((newline = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;

      let response;
      try {
        response = await handle(JSON.parse(line));
      } catch {
        response = {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error' },
        };
      }
      // Notifications get no reply.
      if (response) output.write(JSON.stringify(response) + '\n');
    }
  });
}

export { TOOLS, handle };
