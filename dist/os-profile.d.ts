import type { OsProfile, ShellDialect } from './types.js';
/**
 * Detect OsProfile from the current Node process (or an override for tests).
 * Agent cannot mutate this — PolicyCompiler receives a fresh detect each compile unless injected.
 */
export declare function detectOsProfile(opts?: {
    platform?: string;
    arch?: string;
    strictPathMode?: boolean;
    dialect?: ShellDialect;
}): OsProfile;
