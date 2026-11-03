/**
 * Path / shell dialect hygiene for tools/pre-execute.
 * Never silently rewrites commands — only allow|deny|ask + hint.
 */
import type { OsProfile, PathHygieneResult } from './types.js';
/** Heuristic: token looks path-like (may false-positive; prefer ask over silent rewrite). */
export declare function extractPathLikeTokens(command: string): string[];
/**
 * Check a shell/path-looking command against OsProfile.
 * Decision only — callers must not auto-mutate argv.
 */
export declare function pathHygieneCheck(command: string, osProfile: OsProfile): PathHygieneResult;
