const DIALECT_DEFAULT = {
    linux: 'bash',
    darwin: 'zsh',
    win32: 'powershell',
};
function asPlatform(raw) {
    if (raw === 'linux' || raw === 'darwin' || raw === 'win32')
        return raw;
    // Unknown → treat as linux-like POSIX for path tips (honest fallback).
    return 'linux';
}
/**
 * Detect OsProfile from the current Node process (or an override for tests).
 * Agent cannot mutate this — PolicyCompiler receives a fresh detect each compile unless injected.
 */
export function detectOsProfile(opts) {
    const platform = asPlatform(opts?.platform ?? process.platform);
    const arch = opts?.arch ?? process.arch;
    const pathSep = platform === 'win32' ? '\\' : '/';
    const pathDelimiter = platform === 'win32' ? ';' : ':';
    const dialectDefault = DIALECT_DEFAULT[platform];
    const dialect = opts?.dialect ?? dialectDefault;
    const strictPathMode = opts?.strictPathMode ?? (platform === 'win32'); /* Brief: Win default On */
    return {
        platform,
        arch,
        pathSep,
        pathDelimiter,
        dialectDefault,
        dialect,
        strictPathMode,
    };
}
