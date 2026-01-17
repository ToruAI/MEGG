/**
 * Path resolution and .megg discovery utilities
 */

import path from 'path';
import fs from 'fs/promises';
import { exists, listFiles } from './files.js';

export const MEGG_DIR_NAME = '.megg';
export const INFO_FILE_NAME = 'info.md';
export const KNOWLEDGE_FILE_NAME = 'knowledge.md';
export const STATE_FILE_NAME = 'state.md';

/**
 * Resolves an absolute path from the project root.
 */
export function resolvePath(projectRoot: string, relativePath: string): string {
  return path.resolve(projectRoot, relativePath);
}

/**
 * Walks UP the directory tree to find all ancestor .megg directories.
 * Returns paths from root to target (closest ancestor last).
 */
export async function findAncestorMegg(targetPath: string): Promise<string[]> {
  const chain: string[] = [];
  let current = path.resolve(targetPath);

  // Walk up until we hit filesystem root
  while (current !== path.dirname(current)) {
    const meggPath = path.join(current, MEGG_DIR_NAME);
    const infoPath = path.join(meggPath, INFO_FILE_NAME);

    if (await exists(infoPath)) {
      chain.unshift(meggPath); // Add to front (root first)
    }

    current = path.dirname(current);
  }

  return chain;
}

/**
 * Finds the nearest .megg directory (at or above the target path).
 */
export async function findNearestMegg(targetPath: string): Promise<string | null> {
  let current = path.resolve(targetPath);

  while (current !== path.dirname(current)) {
    const meggPath = path.join(current, MEGG_DIR_NAME);
    if (await exists(meggPath)) {
      return meggPath;
    }
    current = path.dirname(current);
  }

  return null;
}

/**
 * Finds sibling .megg directories (at the same level as target).
 */
export async function findSiblingMegg(targetPath: string): Promise<string[]> {
  const resolved = path.resolve(targetPath);
  const parent = path.dirname(resolved);
  const siblings: string[] = [];

  try {
    const entries = await fs.readdir(parent, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === path.basename(resolved)) continue; // Skip self
      if (entry.name.startsWith('.')) continue; // Skip hidden dirs

      const siblingMegg = path.join(parent, entry.name, MEGG_DIR_NAME);
      if (await exists(siblingMegg)) {
        siblings.push(entry.name);
      }
    }
  } catch {
    // Parent doesn't exist or not readable
  }

  return siblings.sort();
}

/**
 * Finds child .megg directories (immediate children only).
 */
export async function findChildMegg(targetPath: string): Promise<string[]> {
  const resolved = path.resolve(targetPath);
  const children: string[] = [];

  try {
    const entries = await fs.readdir(resolved, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.')) continue; // Skip hidden dirs

      const childMegg = path.join(resolved, entry.name, MEGG_DIR_NAME);
      if (await exists(childMegg)) {
        children.push(entry.name);
      }
    }
  } catch {
    // Target doesn't exist or not readable
  }

  return children.sort();
}

/**
 * Recursively finds ALL .megg directories under a path.
 */
export async function findAllMegg(rootPath: string, maxDepth: number = 10): Promise<string[]> {
  const allMegg: string[] = [];

  async function scan(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;

    // Check if this directory has .megg
    const meggPath = path.join(dir, MEGG_DIR_NAME);
    if (await exists(meggPath)) {
      allMegg.push(meggPath);
    }

    // Scan children
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith('.')) continue;
        if (shouldSkipDir(entry.name)) continue;

        await scan(path.join(dir, entry.name), depth + 1);
      }
    } catch {
      // Not readable
    }
  }

  await scan(path.resolve(rootPath), 0);
  return allMegg;
}

/**
 * Directories to skip during scanning.
 */
function shouldSkipDir(name: string): boolean {
  const skipDirs = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '__pycache__',
    '.venv',
    'venv',
    '.next',
    '.nuxt',
    'target',
    '.cargo',
    'vendor',
    'coverage',
  ];
  return skipDirs.includes(name);
}

/**
 * Gets the domain name from a .megg path.
 */
export function getDomainName(meggPath: string): string {
  // .megg path is like /path/to/domain/.megg
  // Domain name is the parent directory name
  return path.basename(path.dirname(meggPath));
}

/**
 * Legacy: Finds all .megg directories from project root down to the target path.
 * Kept for backward compatibility.
 */
export async function findMeggDirs(projectRoot: string, targetPath: string): Promise<string[]> {
  const absoluteRoot = path.resolve(projectRoot);
  const absoluteTarget = path.resolve(projectRoot, targetPath);

  if (!absoluteTarget.startsWith(absoluteRoot)) {
    throw new Error('Target path must be within project root');
  }

  const relativeTarget = path.relative(absoluteRoot, absoluteTarget);
  const segments = relativeTarget.split(path.sep);

  const meggDirs: string[] = [];
  let currentPath = absoluteRoot;

  // Check root .megg
  if (await exists(path.join(currentPath, MEGG_DIR_NAME))) {
    meggDirs.push(path.join(currentPath, MEGG_DIR_NAME));
  }

  // Check each segment
  if (segments[0] !== '') {
    for (const segment of segments) {
      currentPath = path.join(currentPath, segment);
      const meggPath = path.join(currentPath, MEGG_DIR_NAME);
      if (await exists(meggPath)) {
        meggDirs.push(meggPath);
      }
    }
  }

  return meggDirs;
}

/**
 * Finds specific files within a .megg directory.
 */
export async function findMeggFiles(meggDir: string, patterns?: string[]): Promise<string[]> {
  const allFiles = await listFiles(meggDir);
  if (!patterns) return allFiles.map(f => path.join(meggDir, f));

  return patterns
    .filter(p => allFiles.includes(p))
    .map(p => path.join(meggDir, p));
}
