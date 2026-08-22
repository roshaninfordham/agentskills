/**
 * Minimal YAML frontmatter reader.
 *
 * Deliberately not a YAML parser. Skill frontmatter is a fixed, flat shape --
 * scalars, inline arrays, and folded multi-line scalars -- and validate.js
 * rejects anything outside it. Keeping this in-house is what lets the package
 * ship with no runtime dependencies.
 */

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Split a SKILL.md into its frontmatter object and its body.
 * @param {string} source
 * @returns {{ data: Record<string, string|string[]>, body: string }}
 */
export function parseFrontmatter(source) {
  const text = source.replace(/^﻿/, '');
  const match = FENCE.exec(text);
  if (!match) return { data: {}, body: text.trim() };

  const data = {};
  let key = null;

  for (const raw of match[1].split(/\r?\n/)) {
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue;

    // An indented line folds into the previous key's value.
    if (/^\s/.test(raw) && key) {
      data[key] = `${data[key]} ${raw.trim()}`.trim();
      continue;
    }

    const sep = raw.indexOf(':');
    if (sep === -1) continue;

    key = raw.slice(0, sep).trim();
    data[key] = parseScalar(raw.slice(sep + 1).trim());
  }

  return { data, body: text.slice(match[0].length).trim() };
}

function parseScalar(value) {
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => unquote(item.trim()))
      .filter(Boolean);
  }
  return unquote(value);
}

function unquote(value) {
  const quoted =
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"));
  return quoted && value.length > 1 ? value.slice(1, -1) : value;
}

/**
 * Rough token count, good to about 10%. Used for the budget CI enforces and
 * for the cost shown in listings, never for anything that must be exact.
 * @param {string} text
 * @returns {number}
 */
export function estimateTokens(text) {
  return Math.ceil(text.trim().length / 4);
}
