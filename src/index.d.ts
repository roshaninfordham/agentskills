/** A skill's index entry: everything except its body. */
export interface SkillMeta {
  /** Unique skill name, matching its folder. */
  name: string;
  /** When to use this skill. The only text an agent sees when choosing. */
  description: string;
  tags: string[];
  /** Who wrote the skill. Optional, and credited in listings. */
  author: string;
  /** Folder name under skills/. */
  folder: string;
  /** Path to SKILL.md, relative to the package root. */
  path: string;
  /** Approximate token cost of the body. */
  tokens: number;
  /** Filenames under the skill's reference/ directory. */
  references: string[];
}

/** A fully loaded skill. */
export interface Skill extends SkillMeta {
  /** The instructions, without frontmatter. */
  body: string;
  /** The complete SKILL.md, frontmatter included. */
  source: string;
}

export interface Registry {
  version: string;
  skills: SkillMeta[];
}

export type TargetName = 'claude' | 'cursor' | 'windsurf' | 'agents-md' | 'raw';

export function loadRegistry(): Promise<Registry>;
export function scanSkills(): Promise<SkillMeta[]>;
export function searchSkills(query: string, limit?: number): Promise<SkillMeta[]>;
export function getSkill(name: string): Promise<Skill>;
export function getReference(name: string, file: string): Promise<string>;
export function parseFrontmatter(source: string): {
  data: Record<string, string | string[]>;
  body: string;
};
export function estimateTokens(text: string): number;
export function installSkill(
  name: string,
  options?: { target?: TargetName; cwd?: string },
): Promise<{ target: TargetName; files: string[] }>;
export const TARGETS: Record<TargetName, { label: string; detect: string[] }>;
