import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { parseFrontmatter, estimateTokens } from '../src/frontmatter.js';
import { loadRegistry, searchSkills } from '../src/registry.js';
import { getSkill, getReference } from '../src/skills.js';
import { installSkill, TARGETS } from '../src/targets.js';
import { handle, TOOLS } from '../src/mcp.js';

test('frontmatter: parses scalars, inline arrays, and folded values', () => {
  const { data, body } = parseFrontmatter(
    '---\nname: demo\ndescription: Use when a thing\n  keeps going\ntags: [a, b]\n---\n\nBody here',
  );
  assert.equal(data.name, 'demo');
  assert.equal(data.description, 'Use when a thing keeps going');
  assert.deepEqual(data.tags, ['a', 'b']);
  assert.equal(body, 'Body here');
});

test('frontmatter: a file with no frontmatter is all body', () => {
  const { data, body } = parseFrontmatter('# Just markdown');
  assert.deepEqual(data, {});
  assert.equal(body, '# Just markdown');
});

test('estimateTokens grows with length', () => {
  assert.ok(estimateTokens('a'.repeat(400)) > estimateTokens('a'.repeat(40)));
});

test('registry: every skill has the fields the contract promises', async () => {
  const { skills } = await loadRegistry();
  assert.ok(skills.length > 0, 'registry should not be empty');
  for (const skill of skills) {
    assert.match(skill.name, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${skill.name} is kebab-case`);
    assert.ok(skill.description.length > 20, `${skill.name} has a description`);
    assert.ok(skill.tokens > 0, `${skill.name} has a token estimate`);
    assert.ok(Array.isArray(skill.tags));
  }
});

test('registry: descriptions say WHEN to use the skill', async () => {
  const { skills } = await loadRegistry();
  for (const skill of skills) {
    assert.match(
      skill.description.toLowerCase(),
      /use when|when you|when a |when the |for when/,
      `${skill.name} description must state when to use it`,
    );
  }
});

test('search ranks an exact name above a description match', async () => {
  const results = await searchSkills('reproducing-before-fixing');
  assert.equal(results[0].name, 'reproducing-before-fixing');
});

test('search returns nothing for a query that matches nothing', async () => {
  assert.deepEqual(await searchSkills('zzzzqqqq'), []);
});

test('getSkill returns a body and the raw source', async () => {
  const skill = await getSkill('reproducing-before-fixing');
  assert.ok(skill.body.length > 100);
  assert.ok(skill.source.startsWith('---'));
  assert.ok(!skill.body.startsWith('---'), 'body excludes frontmatter');
});

test('getSkill rejects an unknown name with a useful message', async () => {
  await assert.rejects(() => getSkill('no-such-skill'), /Unknown skill/);
});

test('getReference refuses a path outside the skill', async () => {
  const { skills } = await loadRegistry();
  const withRefs = skills.find((s) => s.references.length);
  if (!withRefs) return; // no skill ships references yet
  await assert.rejects(
    () => getReference(withRefs.name, '../../../etc/passwd'),
    /has no reference/,
  );
});

test('installSkill writes into the layout each target expects', async () => {
  for (const target of Object.keys(TARGETS)) {
    const dir = await mkdtemp(join(tmpdir(), 'agentskills-'));
    const { files } = await installSkill('reproducing-before-fixing', { target, cwd: dir });
    assert.ok(files.length > 0, `${target} wrote a file`);
    const written = await readFile(join(dir, files[0]), 'utf8');
    assert.ok(written.includes('Reproduce first'), `${target} wrote the skill body`);
  }
});

test('installSkill rejects an unknown target', async () => {
  await assert.rejects(
    () => installSkill('reproducing-before-fixing', { target: 'emacs' }),
    /Unknown target/,
  );
});

test('mcp: exposes exactly two tools, so cost stays flat as the library grows', () => {
  assert.equal(TOOLS.length, 2);
  assert.deepEqual(TOOLS.map((t) => t.name).sort(), ['find_skill', 'load_skill']);
});

test('mcp: initialize echoes the client protocol version', async () => {
  const res = await handle({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: '2025-06-18' },
  });
  assert.equal(res.result.protocolVersion, '2025-06-18');
  assert.equal(res.result.serverInfo.name, 'agentskills');
});

test('mcp: notifications get no response', async () => {
  assert.equal(await handle({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
});

test('mcp: an unknown method is a JSON-RPC error', async () => {
  const res = await handle({ jsonrpc: '2.0', id: 9, method: 'nope' });
  assert.equal(res.error.code, -32601);
});

test('mcp: a failing tool call returns isError, not a protocol error', async () => {
  const res = await handle({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: { name: 'load_skill', arguments: { name: 'nope' } },
  });
  assert.equal(res.result.isError, true);
  assert.match(res.result.content[0].text, /Unknown skill/);
});

test('mcp: find_skill returns descriptions but never skill bodies', async () => {
  const res = await handle({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'find_skill', arguments: { query: 'reproduce a bug' } },
  });
  const text = res.result.content[0].text;
  assert.match(text, /reproducing-before-fixing/);
  assert.ok(!text.includes('## The rule'), 'find_skill must not leak bodies');
});

test('mcp: the always-resident tool schemas stay under the token budget', () => {
  assert.ok(
    estimateTokens(JSON.stringify(TOOLS)) < 400,
    'two-tool schema must stay cheap — this is the whole design',
  );
});
