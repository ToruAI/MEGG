/**
 * megg v1.1.0 - Simplified memory system for AI agents
 *
 * Core concepts:
 * - Domain hierarchy (for bounded contexts like clients, products)
 * - Flat knowledge (no code folder hierarchy)
 * - Size-aware loading
 * - Auto-discovery
 */

// ============================================================================
// Knowledge Entry Types
// ============================================================================

export type EntryType = 'decision' | 'pattern' | 'gotcha' | 'context';

export interface KnowledgeEntry {
  date: string;
  title: string;
  type: EntryType;
  topics: string[];
  content: string;
  raw: string;  // Original markdown block
}

export interface ParsedKnowledge {
  entries: KnowledgeEntry[];
  tokens: number;
  topics: string[];
  oldestEntry?: string;
  newestEntry?: string;
}

// ============================================================================
// Context Types
// ============================================================================

export interface DomainInfo {
  domain: string;
  path: string;
  meggPath: string;
  info: string;
}

export type KnowledgeMode = 'full' | 'summary' | 'blocked';

export interface KnowledgeResult {
  content: string;
  mode: KnowledgeMode;
  tokens: number;
  entries: number;
  topics: string[];
  warning?: string;
}

export interface MeggFile {
  name: string;
  path: string;
  loaded: boolean;
}

export interface ContextResult {
  chain: DomainInfo[];
  knowledge: KnowledgeResult | null;
  state: StateResult | null;
  siblings: string[];
  children: string[];
  files: MeggFile[];  // All files in current .megg directory
}

// ============================================================================
// State Types (ephemeral session handoff)
// ============================================================================

export type StateStatus = 'active' | 'done';

export interface StateResult {
  content: string;
  status: StateStatus;
  updated: string;  // ISO timestamp
  tokens: number;
  expired: boolean;
  path: string;
}

export interface StateInput {
  content?: string;
  status?: StateStatus;
  path?: string;
}

export interface StateCommandResult {
  success: boolean;
  state?: StateResult;
  warning?: string;
  error?: string;
}

// ============================================================================
// Init Types
// ============================================================================

export interface ProjectStructure {
  tree: string;
  keyFiles: string[];
  suggestedType: 'domain' | 'codebase';
}

export interface InitAnalysis {
  status: 'ready' | 'needs_input' | 'already_initialized';
  parentChain?: DomainInfo[];
  structure?: ProjectStructure;
  questions?: string[];
  message?: string;
}

export interface InitContent {
  info: string;
  knowledge?: string;
}

// ============================================================================
// Learn Types
// ============================================================================

export interface LearnInput {
  title: string;
  type: EntryType;
  topics: string[];
  content: string;
  path?: string;
}

export interface LearnResult {
  success: boolean;
  path?: string;
  warning?: string;
  error?: string;
}

// ============================================================================
// Maintain Types
// ============================================================================

export type IssueProblem = 'bloated' | 'stale' | 'duplicates';
export type ActionType = 'consolidate' | 'archive' | 'summarize';

export interface MaintenanceIssue {
  path: string;
  problem: IssueProblem;
  details: string;
  suggestedAction: string;
}

export interface MaintenanceAction {
  type: ActionType;
  target: string;
  preview: string;
  entries?: string[];
}

export interface MaintenanceReport {
  scanned: number;
  totalTokens: number;
  totalEntries: number;
  issues: MaintenanceIssue[];
  actions: MaintenanceAction[];
}

// ============================================================================
// Hook Output Types (for Claude Code integration)
// ============================================================================

export interface SessionStartOutput {
  systemMessage?: string;  // Shown to user in terminal
  hookSpecificOutput: {
    hookEventName: 'SessionStart';
    additionalContext: string;
  };
}

export interface StopHookOutput {
  ok: boolean;
  reason?: string;
}

// ============================================================================
// Configuration
// ============================================================================

export interface MeggConfig {
  maxKnowledgeTokens?: number;  // Default: 8000
  summaryThreshold?: number;    // Default: 8000
  blockThreshold?: number;      // Default: 16000
  stalenessDays?: number;       // Default: 90
}

export const DEFAULT_CONFIG: MeggConfig = {
  maxKnowledgeTokens: 8000,
  summaryThreshold: 8000,
  blockThreshold: 16000,
  stalenessDays: 90,
};
