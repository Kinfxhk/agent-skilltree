// SPDX-License-Identifier: MIT
/** Shared types for agent-skilltree M0 policy core. */

export type TabId = 'perception' | 'execution' | 'governance';

export type DomainId = 'core' | 'development' | 'research' | 'assistant' | 'governance';

export type PlatformId = 'linux' | 'darwin' | 'win32';

export type ShellDialect =
  | 'bash'
  | 'sh'
  | 'zsh'
  | 'powershell'
  | 'cmd'
  | 'wsl'
  | 'git-bash';

export type DangerLevel = 'low' | 'medium' | 'high';

export type AdmitDecision = 'allow' | 'deny' | 'ask';

export interface SkillNode {
  id: string;
  tab: TabId;
  domain?: DomainId;
  name_zh: string;
  name_en?: string;
  rank?: number;
  cost: number;
  requires: string[];
  grants: string[];
  danger?: DangerLevel;
  capstone?: boolean;
  default_enabled?: boolean;
  default_enabled_by_platform?: Partial<Record<PlatformId, boolean>>;
  note?: string;
}

export interface SkillCatalog {
  meta: {
    schema: string;
    host_pin: string;
    public_name: string;
    constitution: string;
  };
  tabs: TabId[];
  nodes: SkillNode[];
}

export interface OsProfile {
  platform: PlatformId;
  arch: string;
  pathSep: string;
  pathDelimiter: string;
  dialectDefault: ShellDialect;
  dialect: ShellDialect;
  strictPathMode: boolean;
}

export interface SkillTreeState {
  /** Allocated ranks / unlocked node ids → points spent on that node (usually cost once). */
  unlocked: Record<string, number>;
  /** Remaining spendable points (human-granted). */
  pointsRemaining: number;
  /** Actor that last mutated the tree — agent mutations of dangerous nodes are rejected. */
  lastActor: 'human' | 'agent' | 'system';
}

export interface AgentPolicy {
  toolAllow: string[];
  toolDeny: string[];
  toolAsk: string[];
  maxParallelToolCalls: number;
  turnCap: 'off' | 'low' | 'mid' | 'high';
  subagentsMaxDepth: number;
  subagentsMaxActive: number;
  approvalWrite: 'deny' | 'ask' | 'allow';
  approvalShell: 'deny' | 'ask' | 'allow';
  approvalNetwork: 'deny' | 'ask' | 'allow';
  sandboxFloor: 'read-only' | 'workspace-write' | 'danger-full-access';
  systemPromptBudget: number;
  productGateway: 'off' | 'on_demand' | 'persistent';
  nsfwGate: boolean;
  contentPolicy: boolean;
  pathHygiene: boolean;
  shellDialectTips: boolean;
  osProfile: OsProfile;
  constitutionLocked: true;
  grants: string[];
}

export interface PathHygieneResult {
  decision: AdmitDecision;
  reason: string;
  hint?: string;
}
