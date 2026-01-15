/**
 * init() - Initialize megg in a project
 *
 * Single command that:
 * 1. Analyzes project structure
 * 2. Returns questions for the agent to ask user
 * 3. Creates .megg files when content is provided
 */

import path from 'path';
import fs from 'fs/promises';
import type { InitAnalysis, InitContent, DomainInfo, ProjectStructure } from '../types.js';
import { exists, readFile, writeFile, getTimestamp, ensureDir } from '../utils/files.js';
import { findAncestorMegg, getDomainName, MEGG_DIR_NAME, INFO_FILE_NAME, KNOWLEDGE_FILE_NAME } from '../utils/paths.js';

// Key files to detect
const KEY_FILE_PATTERNS = [
  'README.md',
  'readme.md',
  'package.json',
  'Cargo.toml',
  'pyproject.toml',
  'setup.py',
  'go.mod',
  'tsconfig.json',
  'Dockerfile',
  'docker-compose.yml',
  'Makefile',
  '.env.example',
];

// Directories to skip
const SKIP_DIRS = [
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

/**
 * Main init command.
 *
 * If content is provided, creates the .megg files.
 * If not, analyzes the project and returns questions.
 */
export async function init(
  projectRoot?: string,
  content?: InitContent
): Promise<InitAnalysis | { success: boolean; message: string }> {
  const root = projectRoot || process.cwd();
  const meggDir = path.join(root, MEGG_DIR_NAME);
  const infoPath = path.join(meggDir, INFO_FILE_NAME);

  // If content provided, create the files
  if (content) {
    return createMeggFiles(root, content);
  }

  // Check if already initialized
  if (await exists(infoPath)) {
    return {
      status: 'already_initialized',
      message: 'megg already initialized. Use context() to load.',
    };
  }

  // Analyze project
  return analyzeProject(root);
}

/**
 * Analyzes project and returns information for agent.
 */
async function analyzeProject(root: string): Promise<InitAnalysis> {
  // 1. Find parent chain (for context inheritance)
  const parentMegg = await findAncestorMegg(path.dirname(root));
  const parentChain: DomainInfo[] = [];

  for (const meggPath of parentMegg) {
    try {
      const info = await readFile(path.join(meggPath, INFO_FILE_NAME));
      parentChain.push({
        domain: getDomainName(meggPath),
        path: path.dirname(meggPath),
        meggPath,
        info,
      });
    } catch {
      // Skip if can't read
    }
  }

  // 2. Scan project structure
  const structure = await scanProjectStructure(root);

  // 3. Determine questions based on type
  const questions = structure.suggestedType === 'domain'
    ? [
        'What is this domain/area about? (Context)',
        'Any rules I should always follow here? (Rules)',
        'What should I watch for and ask about capturing? (Learning)',
      ]
    : [
        'What is this project and what problem does it solve? (Context)',
        'Any coding conventions or rules to follow? (Rules)',
        'What should I watch for and ask about capturing? (Learning)',
      ];

  return {
    status: 'needs_input',
    parentChain: parentChain.length > 0 ? parentChain : undefined,
    structure,
    questions,
  };
}

/**
 * Scans project structure to detect type and key files.
 */
async function scanProjectStructure(root: string): Promise<ProjectStructure> {
  const keyFiles: string[] = [];
  let hasCodeFiles = false;

  // Check for key files
  for (const pattern of KEY_FILE_PATTERNS) {
    if (await exists(path.join(root, pattern))) {
      keyFiles.push(pattern);

      // Detect if this is a codebase
      if (['package.json', 'Cargo.toml', 'go.mod', 'pyproject.toml'].includes(pattern)) {
        hasCodeFiles = true;
      }
    }
  }

  // Build tree
  const tree = await buildTree(root, 0, 3);

  // Determine type
  const suggestedType = hasCodeFiles ? 'codebase' : 'domain';

  return {
    tree,
    keyFiles,
    suggestedType,
  };
}

/**
 * Builds ASCII tree of directory structure.
 */
async function buildTree(dir: string, depth: number, maxDepth: number): Promise<string> {
  if (depth >= maxDepth) return '';

  const entries = await fs.readdir(dir, { withFileTypes: true });
  const lines: string[] = [];
  const indent = '  '.repeat(depth);

  // Sort: directories first, then files
  const sorted = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of sorted) {
    // Skip hidden and ignored directories
    if (entry.name.startsWith('.') && entry.name !== '.megg') continue;
    if (entry.isDirectory() && SKIP_DIRS.includes(entry.name)) continue;

    const prefix = entry.isDirectory() ? '📁 ' : '📄 ';
    lines.push(`${indent}${prefix}${entry.name}`);

    // Recurse into directories
    if (entry.isDirectory() && depth < maxDepth - 1) {
      const subtree = await buildTree(path.join(dir, entry.name), depth + 1, maxDepth);
      if (subtree) lines.push(subtree);
    }
  }

  return lines.join('\n');
}

/**
 * Creates .megg files with provided content.
 */
async function createMeggFiles(
  root: string,
  content: InitContent
): Promise<{ success: boolean; message: string }> {
  const meggDir = path.join(root, MEGG_DIR_NAME);
  const now = getTimestamp();

  try {
    await ensureDir(meggDir);

    // Create info.md
    const infoContent = `---
created: ${now}
updated: ${now}
type: context
---

${content.info}
`;
    await writeFile(path.join(meggDir, INFO_FILE_NAME), infoContent);

    // Create knowledge.md if provided
    if (content.knowledge) {
      const knowledgeContent = `---
created: ${now}
updated: ${now}
type: knowledge
---

# Knowledge

${content.knowledge}
`;
      await writeFile(path.join(meggDir, KNOWLEDGE_FILE_NAME), knowledgeContent);
    }

    return {
      success: true,
      message: `✓ megg initialized in ${meggDir}`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to initialize: ${err}`,
    };
  }
}

/**
 * CLI-friendly init command.
 */
export async function initCommand(
  projectRoot?: string,
  infoContent?: string,
  knowledgeContent?: string
): Promise<string> {
  // If content provided, create files
  if (infoContent) {
    const content: InitContent = {
      info: infoContent,
      knowledge: knowledgeContent,
    };

    const result = await init(projectRoot, content);

    if ('success' in result) {
      return result.message;
    }
  }

  // Otherwise, analyze and return info
  const analysis = await init(projectRoot);

  if ('status' in analysis) {
    if (analysis.status === 'already_initialized') {
      return analysis.message || 'Already initialized.';
    }

    // Format analysis for display
    let output = '# megg Init Analysis\n\n';

    if (analysis.parentChain && analysis.parentChain.length > 0) {
      output += '## Parent Context\n\n';
      output += 'This location inherits from:\n';
      for (const parent of analysis.parentChain) {
        output += `- ${parent.domain}\n`;
      }
      output += '\n';
    }

    if (analysis.structure) {
      output += '## Project Structure\n\n';
      output += '```\n' + analysis.structure.tree + '\n```\n\n';

      if (analysis.structure.keyFiles.length > 0) {
        output += '**Key files found:** ' + analysis.structure.keyFiles.join(', ') + '\n\n';
      }

      output += `**Detected type:** ${analysis.structure.suggestedType}\n\n`;
    }

    if (analysis.questions) {
      output += '## Questions to Answer\n\n';
      for (const q of analysis.questions) {
        output += `- ${q}\n`;
      }
      output += '\n';
    }

    output += '---\n\n';
    output += 'Provide answers and call `init(path, { info: "...", knowledge: "..." })` to complete.';

    return output;
  }

  return 'Unexpected result';
}

/**
 * Generate info.md template based on project type.
 */
export function generateInfoTemplate(
  name: string,
  type: 'domain' | 'codebase',
  context: string,
  rules: string[],
  learning?: string[]
): string {
  const rulesSection = rules.length > 0
    ? rules.map((r, i) => `${i + 1}. ${r}`).join('\n')
    : '1. [Add your rules here]';

  const learningSection = learning && learning.length > 0
    ? learning.map(l => `- ${l}`).join('\n')
    : '- User preferences and values\n- Non-obvious decisions\n- Gotchas and traps discovered';

  return `# ${name}

## Context
${context}

## Rules
${rulesSection}

## Learning
Watch for and ask about capturing:
${learningSection}

## Files
- knowledge.md (auto-loaded)
`;
}
