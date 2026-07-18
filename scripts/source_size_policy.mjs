import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, posix, resolve } from "node:path";

export const SOURCE_SIZE_LIMIT = 300;
export const DEFAULT_BASELINE_PATH = "source-size-baseline.json";

const SOURCE_EXTENSIONS = new Set([
  ".bash", ".cjs", ".css", ".cts", ".fish", ".html", ".js", ".jsx",
  ".less", ".mjs", ".mts", ".pcss", ".ps1", ".sass", ".scss", ".sh",
  ".styl", ".svelte", ".ts", ".tsx", ".vue", ".zsh",
]);
const EXCLUDED_DIRECTORIES = new Set([
  ".git", ".generated", ".next", ".nuxt", "__generated__", "build",
  "coverage", "dist", "generated", "node_modules", "out", "target", "vendor",
]);
const LOCKFILES = new Set([
  "bun.lock", "bun.lockb", "npm-shrinkwrap.json", "package-lock.json",
  "pnpm-lock.yaml", "yarn.lock",
]);

function git(cwd, args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function normalizePath(path) {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

function comparePaths(left, right) {
  const foldedLeft = left.toLowerCase();
  const foldedRight = right.toLowerCase();
  if (foldedLeft !== foldedRight) return foldedLeft < foldedRight ? -1 : 1;
  return left === right ? 0 : left < right ? -1 : 1;
}

function hasExcludedDirectory(path) {
  return normalizePath(path).split("/").some((part) => EXCLUDED_DIRECTORIES.has(part));
}

function isGeneratedFile(path) {
  const name = basename(path).toLowerCase();
  return /\.(?:generated|gen)\.[^.]+$/.test(name);
}

function isExecutableConfig(path) {
  const normalized = normalizePath(path);
  const name = basename(normalized);
  if (/^\.github\/workflows\/.*\.ya?ml$/i.test(normalized)) return true;
  if (/^\.env(?:\.|$)/i.test(name)) return true;
  if (/^(?:docker-)?compose(?:\.[^/]+)?\.ya?ml$/i.test(name)) return true;
  if (/^(?:Dockerfile(?:\..+)?|Makefile|package\.json|pnpm-workspace\.yaml)$/i.test(name)) return true;
  if (/^(?:js|ts)config(?:\.[^/]+)?\.json$/i.test(name)) return true;
  if (/\.config\.(?:[cm]?[jt]s|json|ya?ml)$/i.test(name)) return true;
  return /^\.[^.]+rc(?:\.(?:[cm]?[jt]s|json|ya?ml))?$/i.test(name);
}

function hasSourceExtension(path) {
  const name = basename(path).toLowerCase();
  for (const extension of SOURCE_EXTENSIONS) {
    if (name.endsWith(extension)) return true;
  }
  return false;
}

function hasShebang(absolutePath) {
  try {
    return readFileSync(absolutePath, { encoding: "utf8" }).startsWith("#!");
  } catch {
    return false;
  }
}

export function isHandwrittenSource(path, absolutePath = path) {
  const normalized = normalizePath(path);
  const name = basename(normalized).toLowerCase();
  if (hasExcludedDirectory(normalized) || LOCKFILES.has(name)) return false;
  if (name.endsWith(".d.ts") || name.endsWith(".lock") || isGeneratedFile(normalized)) return false;
  return hasSourceExtension(normalized) || isExecutableConfig(normalized) || hasShebang(absolutePath);
}

export function countPhysicalLines(content) {
  if (content.length === 0) return 0;
  const separators = content.match(/\r\n|\r|\n/g)?.length ?? 0;
  return separators + (/\r\n$|\r$|\n$/.test(content) ? 0 : 1);
}

function listWorkingTreeSources(cwd) {
  const output = git(cwd, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]);
  return output.split("\0").filter(Boolean).sort().flatMap((rawPath) => {
    const path = normalizePath(rawPath);
    const absolutePath = resolve(cwd, path);
    if (!isHandwrittenSource(path, absolutePath) || !existsSync(absolutePath)) return [];
    const lines = countPhysicalLines(readFileSync(absolutePath, "utf8"));
    return [{ path, lines }];
  });
}

function parseBaseline(content, label) {
  let document;
  try {
    document = JSON.parse(content);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
  if (document?.version !== 1 || document?.limit !== SOURCE_SIZE_LIMIT || !Array.isArray(document?.files)) {
    throw new Error(`${label} must contain version 1, limit ${SOURCE_SIZE_LIMIT}, and a files array`);
  }
  const entries = new Map();
  let previousPath = "";
  for (const entry of document.files) {
    const path = normalizePath(entry?.path ?? "");
    const ceiling = entry?.ceiling;
    if (!path || posix.isAbsolute(path) || path.startsWith("../")) {
      throw new Error(`${label} contains an invalid path: ${entry?.path ?? "<missing>"}`);
    }
    if (!Number.isInteger(ceiling) || ceiling <= SOURCE_SIZE_LIMIT) {
      throw new Error(`${label} ceiling for ${path} must be an integer above ${SOURCE_SIZE_LIMIT}`);
    }
    if (entries.has(path)) throw new Error(`${label} contains duplicate path ${path}`);
    if (previousPath && comparePaths(previousPath, path) >= 0) {
      throw new Error(`${label} files must be sorted by path`);
    }
    entries.set(path, ceiling);
    previousPath = path;
  }
  return entries;
}

function readCurrentBaseline(cwd, baselinePath) {
  const absolutePath = resolve(cwd, baselinePath);
  if (!existsSync(absolutePath)) return { entries: new Map(), present: false, lines: 0 };
  const content = readFileSync(absolutePath, "utf8");
  return {
    entries: parseBaseline(content, baselinePath),
    present: true,
    lines: countPhysicalLines(content),
  };
}

function readBaseBaseline(cwd, baseRef, baselinePath) {
  if (!baseRef) return { entries: null, bootstrap: false };
  const commit = spawnSync("git", ["cat-file", "-e", `${baseRef}^{commit}`], { cwd });
  if (commit.status !== 0) throw new Error(`SOURCE_SIZE_BASE_REF is not a commit: ${baseRef}`);
  const file = spawnSync("git", ["show", `${baseRef}:${baselinePath}`], {
    cwd,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (file.status !== 0) return { entries: new Map(), bootstrap: true };
  return { entries: parseBaseline(file.stdout, `${baseRef}:${baselinePath}`), bootstrap: false };
}

function validateCurrentFiles(files, baseline, errors) {
  const byPath = new Map(files.map((file) => [file.path, file.lines]));
  for (const file of files) {
    if (file.lines <= SOURCE_SIZE_LIMIT) continue;
    const ceiling = baseline.get(file.path);
    if (ceiling === undefined) {
      errors.push(`${file.path}: ${file.lines} lines, above ${SOURCE_SIZE_LIMIT} and not in the baseline`);
    } else if (file.lines > ceiling) {
      errors.push(`${file.path}: grew to ${file.lines} lines above its baseline ceiling ${ceiling}`);
    } else if (file.lines < ceiling) {
      errors.push(`${file.path}: shrank to ${file.lines} lines; lower its baseline ceiling from ${ceiling}`);
    }
  }
  for (const [path] of baseline) {
    const lines = byPath.get(path);
    if (lines === undefined) errors.push(`${path}: baseline entry has no scanned file; remove the entry`);
    else if (lines <= SOURCE_SIZE_LIMIT) {
      errors.push(`${path}: now ${lines} lines (at or below ${SOURCE_SIZE_LIMIT}); remove the baseline entry`);
    }
  }
}

function readBaseFileLines(cwd, baseRef, path) {
  const file = spawnSync("git", ["show", `${baseRef}:${path}`], {
    cwd,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return file.status === 0 ? countPhysicalLines(file.stdout) : null;
}

function validateBaselineEvolution(current, base, bootstrap, errors, cwd, baseRef) {
  if (base === null) return;
  if (bootstrap) {
    for (const [path, ceiling] of current) {
      const baseLines = readBaseFileLines(cwd, baseRef, path);
      if (baseLines === null || baseLines <= SOURCE_SIZE_LIMIT) {
        errors.push(`${path}: new oversized files cannot be added during baseline bootstrap`);
      } else if (ceiling > baseLines) {
        errors.push(`${path}: grew from ${baseLines} to ${ceiling} lines during baseline bootstrap`);
      }
    }
    return;
  }
  for (const [path, ceiling] of current) {
    const baseCeiling = base.get(path);
    if (baseCeiling === undefined) errors.push(`${path}: new baseline entries are not allowed`);
    else if (ceiling > baseCeiling) {
      errors.push(`${path}: baseline ceiling increased from ${baseCeiling} to ${ceiling}`);
    }
  }
}

export function checkSourceSize({
  cwd = process.cwd(),
  baseRef = process.env.SOURCE_SIZE_BASE_REF ?? "HEAD",
  baselinePath = DEFAULT_BASELINE_PATH,
} = {}) {
  const errors = [];
  let current;
  let base;
  let files;
  try {
    files = listWorkingTreeSources(cwd);
    current = readCurrentBaseline(cwd, baselinePath);
    base = readBaseBaseline(cwd, baseRef.trim(), baselinePath);
  } catch (error) {
    return { ok: false, errors: [error.message], scannedFiles: 0, oversizedFiles: 0, baselineFiles: 0 };
  }
  if (current.present && current.lines > SOURCE_SIZE_LIMIT) {
    errors.push(`${baselinePath}: baseline fragment has ${current.lines} lines; split it below ${SOURCE_SIZE_LIMIT}`);
  }
  validateCurrentFiles(files, current.entries, errors);
  validateBaselineEvolution(
    current.entries,
    base.entries,
    base.bootstrap,
    errors,
    cwd,
    baseRef.trim(),
  );
  return {
    ok: errors.length === 0,
    errors,
    scannedFiles: files.length,
    oversizedFiles: files.filter((file) => file.lines > SOURCE_SIZE_LIMIT).length,
    baselineFiles: current.entries.size,
    bootstrap: base.bootstrap,
  };
}
