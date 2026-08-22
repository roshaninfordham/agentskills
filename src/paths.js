import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/** Root of the installed package, wherever npm put it. */
export const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Directory holding the skill folders. */
export const skillsDir = join(packageRoot, 'skills');

/** Generated index of every skill. */
export const registryPath = join(packageRoot, 'registry.json');
