// SPDX-License-Identifier: MIT
/**
 * Path / shell dialect hygiene for tools/pre-execute.
 * Never silently rewrites commands — only allow|deny|ask + hint.
 */
import type { OsProfile, PathHygieneResult } from './types.js';

const URL_RE = /^[a-z][a-z0-9+.-]+:/i;
/** True for http(s)/file/data… — not Windows drive letters like C:/ */
function isUrlLike(token: string): boolean {
  if (!URL_RE.test(token)) return false;
  // Single-letter scheme ⇒ drive letter (Win), not a URL.
  const scheme = token.slice(0, token.indexOf(':'));
  if (scheme.length === 1) return false;
  return true;
}
const WIN_DRIVE_RE = /^[A-Za-z]:[\\/]/;
const UNC_RE = /^\\\\[^\\]/;
const WSL_MNT_RE = /^\/mnt\/[a-zA-Z]\//;
const POSIX_HOME_RE = /^\/home\//;

/** Heuristic: token looks path-like (may false-positive; prefer ask over silent rewrite). */
export function extractPathLikeTokens(command: string): string[] {
  const parts = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
  return parts
    .map((p) => p.replace(/^["']|["']$/g, ''))
    .filter((p) => {
      if (!p || isUrlLike(p)) return false;
      if (p.includes('/') || p.includes('\\')) return true;
      if (WIN_DRIVE_RE.test(p) || UNC_RE.test(p)) return true;
      return false;
    });
}

function hasMixedSeparators(token: string): boolean {
  if (isUrlLike(token)) return false;
  return token.includes('/') && token.includes('\\');
}

function looksWindowsPath(token: string): boolean {
  return WIN_DRIVE_RE.test(token) || UNC_RE.test(token);
}

/**
 * Check a shell/path-looking command against OsProfile.
 * Decision only — callers must not auto-mutate argv.
 */
export function pathHygieneCheck(command: string, osProfile: OsProfile): PathHygieneResult {
  const tokens = extractPathLikeTokens(command);

  for (const p of tokens) {
    if (isUrlLike(p)) continue;

    if (osProfile.strictPathMode && hasMixedSeparators(p)) {
      return {
        decision: 'deny',
        reason: 'mixed_path_sep',
        hint: 'mixed_path_sep: use dialect-native separator only (never silently rewritten)',
      };
    }

    if (
      (osProfile.platform === 'linux' || osProfile.platform === 'darwin') &&
      looksWindowsPath(p)
    ) {
      return {
        decision: 'deny',
        reason: 'windows_path_on_posix',
        hint: 'windows_path_on_posix: use POSIX / paths on this host',
      };
    }

    if (
      osProfile.platform === 'win32' &&
      (osProfile.dialect === 'powershell' || osProfile.dialect === 'cmd')
    ) {
      if (WSL_MNT_RE.test(p) || POSIX_HOME_RE.test(p)) {
        return {
          decision: osProfile.strictPathMode ? 'deny' : 'ask',
          reason: 'posix_path_on_native_windows',
          hint: 'posix_path_on_native_windows: use Win path or switch dialect=wsl|git-bash',
        };
      }
    }

    if (osProfile.dialect === 'wsl' && looksWindowsPath(p) && !p.startsWith('/mnt/')) {
      return {
        decision: 'ask',
        reason: 'convert_to_mnt',
        hint: 'convert_to_mnt: prefer /mnt/<drive>/... under WSL',
      };
    }

    if (/\s/.test(p) && !/^["'].*["']$/.test(p) && command.includes(p)) {
      // Unquoted whitespace inside a path token already split — flag loose spaces in raw cmd
    }
  }

  // Unquoted path with spaces in the raw command string
  if (/(?:[A-Za-z]:\\|\/)[^\s]*\s+[^\s]*\.(?:exe|dll|bat|cmd|ps1|sh)\b/i.test(command)) {
    return {
      decision: 'ask',
      reason: 'quote_path',
      hint: 'quote_path: whitespace in path-like args should be quoted',
    };
  }

  if (
    osProfile.dialect === 'cmd' &&
    /\b(?:Get|Set|New|Remove|Invoke)-[A-Z]/.test(command)
  ) {
    return {
      decision: 'deny',
      reason: 'wrong_dialect_tip',
      hint: 'wrong_dialect_tip: PowerShell cmdlets are not valid under cmd',
    };
  }

  return { decision: 'allow', reason: 'ok' };
}
