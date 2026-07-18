import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { checkSourceSize } from "./source_size_policy.mjs";

function write(root, path, content) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}

function lines(count) {
  return Array.from({ length: count }, (_, index) => `line ${index + 1}`).join("\n") + "\n";
}

function baseline(entries) {
  const files = Object.entries(entries)
    .sort(([left], [right]) => {
      const foldedLeft = left.toLowerCase();
      const foldedRight = right.toLowerCase();
      return foldedLeft < foldedRight ? -1 : foldedLeft > foldedRight ? 1 : 0;
    })
    .map(([path, ceiling]) => ({ path, ceiling }));
  return `${JSON.stringify({ version: 1, limit: 300, files }, null, 2)}\n`;
}

function createRepo(files = {}) {
  const root = mkdtempSync(join(tmpdir(), "source-size-policy-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "source-size@example.test"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Source Size Test"], { cwd: root });
  for (const [path, content] of Object.entries(files)) write(root, path, content);
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  return root;
}

test("rejects a handwritten file whose name merely contains generated", (t) => {
  const root = createRepo({ "src/existing.ts": lines(10) });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, "src/user-generated-view.ts", lines(301));

  const report = checkSourceSize({ cwd: root });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /src\/user-generated-view\.ts.*301.*not in the baseline/i);
});

test("accepts an existing oversized file only at its exact recorded ceiling", (t) => {
  const root = createRepo({
    "source-size-baseline.json": baseline({ "src/legacy.ts": 301 }),
    "src/legacy.ts": lines(301),
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const report = checkSourceSize({ cwd: root });

  assert.equal(report.ok, true, report.errors.join("\n"));
  assert.equal(report.oversizedFiles, 1);
  assert.equal(report.baselineFiles, 1);
});

test("rejects growth above an existing file ceiling", (t) => {
  const root = createRepo({
    "source-size-baseline.json": baseline({ "src/legacy.ts": 301 }),
    "src/legacy.ts": lines(301),
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, "src/legacy.ts", lines(302));

  const report = checkSourceSize({ cwd: root });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /grew to 302.*ceiling 301/i);
});

test("requires a lower ceiling in the same change when a violation shrinks", (t) => {
  const root = createRepo({
    "source-size-baseline.json": baseline({ "src/legacy.ts": 350 }),
    "src/legacy.ts": lines(350),
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, "src/legacy.ts", lines(320));

  const report = checkSourceSize({ cwd: root });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /shrank to 320.*lower.*350/i);
});

test("requires removing a baseline entry after a file reaches 300 lines", (t) => {
  const root = createRepo({
    "source-size-baseline.json": baseline({ "src/legacy.ts": 301 }),
    "src/legacy.ts": lines(301),
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, "src/legacy.ts", lines(300));

  const report = checkSourceSize({ cwd: root });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /now 300 lines.*remove the baseline entry/i);
});

test("requires removing a baseline entry when its file is deleted", (t) => {
  const root = createRepo({
    "source-size-baseline.json": baseline({ "src/legacy.ts": 301 }),
    "src/legacy.ts": lines(301),
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  rmSync(join(root, "src/legacy.ts"));

  const report = checkSourceSize({ cwd: root });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /no scanned file.*remove the entry/i);
});

test("rejects a ceiling increase relative to the base commit", (t) => {
  const root = createRepo({
    "source-size-baseline.json": baseline({ "src/legacy.ts": 301 }),
    "src/legacy.ts": lines(301),
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, "source-size-baseline.json", baseline({ "src/legacy.ts": 302 }));
  write(root, "src/legacy.ts", lines(302));

  const report = checkSourceSize({ cwd: root, baseRef: "HEAD" });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /ceiling increased from 301 to 302/i);
});

test("rejects adding a baseline entry after bootstrap", (t) => {
  const root = createRepo({
    "source-size-baseline.json": baseline({ "src/legacy.ts": 301 }),
    "src/legacy.ts": lines(301),
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, "source-size-baseline.json", baseline({
    "src/legacy.ts": 301,
    "src/new.ts": 301,
  }));
  write(root, "src/new.ts", lines(301));

  const report = checkSourceSize({ cwd: root, baseRef: "HEAD" });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /src\/new\.ts.*new baseline entries are not allowed/i);
});

test("allows the first baseline when the base commit has none", (t) => {
  const root = createRepo({ "src/legacy.ts": lines(301) });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, "source-size-baseline.json", baseline({ "src/legacy.ts": 301 }));

  const report = checkSourceSize({ cwd: root, baseRef: "HEAD" });

  assert.equal(report.ok, true, report.errors.join("\n"));
  assert.equal(report.bootstrap, true);
});

test("rejects a new oversized file during first-baseline bootstrap", (t) => {
  const root = createRepo({ "src/existing.ts": lines(10) });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, "src/new.ts", lines(301));
  write(root, "source-size-baseline.json", baseline({ "src/new.ts": 301 }));

  const report = checkSourceSize({ cwd: root, baseRef: "HEAD" });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /src\/new\.ts.*cannot be added during baseline bootstrap/i);
});

test("rejects growth hidden inside first-baseline bootstrap", (t) => {
  const root = createRepo({ "src/legacy.ts": lines(301) });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, "src/legacy.ts", lines(302));
  write(root, "source-size-baseline.json", baseline({ "src/legacy.ts": 302 }));

  const report = checkSourceSize({ cwd: root, baseRef: "HEAD" });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /src\/legacy\.ts.*grew from 301 to 302.*bootstrap/i);
});

test("treats an oversized renamed destination as a new baseline violation", (t) => {
  const root = createRepo({
    "source-size-baseline.json": baseline({ "src/old.ts": 301 }),
    "src/old.ts": lines(301),
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, "src/new.ts", lines(301));
  rmSync(join(root, "src/old.ts"));
  write(root, "source-size-baseline.json", baseline({ "src/new.ts": 301 }));

  const report = checkSourceSize({ cwd: root, baseRef: "HEAD" });

  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /src\/new\.ts.*new baseline entries are not allowed/i);
});

test("accepts a synchronized ceiling reduction", (t) => {
  const root = createRepo({
    "source-size-baseline.json": baseline({ "src/legacy.ts": 350 }),
    "src/legacy.ts": lines(350),
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, "source-size-baseline.json", baseline({ "src/legacy.ts": 320 }));
  write(root, "src/legacy.ts", lines(320));

  const report = checkSourceSize({ cwd: root, baseRef: "HEAD" });

  assert.equal(report.ok, true, report.errors.join("\n"));
});

test("scans untracked code, tests, styles, scripts, and executable configuration", (t) => {
  const root = createRepo({ "src/existing.ts": lines(10) });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const oversized = {
    ".env.local": lines(301),
    ".github/workflows/ci.yml": lines(301),
    "docker-compose.yml": lines(301),
    "scripts/task.sh": lines(301),
    "src/page.css": lines(301),
    "tests/page.test.ts": lines(301),
    "tool": `#!/usr/bin/env node\n${lines(300)}`,
  };
  for (const [path, content] of Object.entries(oversized)) write(root, path, content);

  const report = checkSourceSize({ cwd: root });
  const messages = report.errors.join("\n");

  assert.equal(report.oversizedFiles, 7);
  for (const path of Object.keys(oversized)) assert.match(messages, new RegExp(path.replaceAll(".", "\\.")));
});

test("excludes dependencies, build output, generated files, declarations, and lockfiles", (t) => {
  const root = createRepo({
    ".generated/cache.ts": lines(301),
    "dist/bundle.js": lines(301),
    "generated/routes.ts": lines(301),
    "node_modules/library/index.js": lines(301),
    "package-lock.json": lines(301),
    "pnpm-lock.yaml": lines(301),
    "src/api.generated.ts": lines(301),
    "src/types.d.ts": lines(301),
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const report = checkSourceSize({ cwd: root });

  assert.equal(report.ok, true, report.errors.join("\n"));
  assert.equal(report.oversizedFiles, 0);
});

test("counts comments and blank lines as physical lines", (t) => {
  const content = `${Array.from({ length: 299 }, () => "// comment").join("\n")}\n\n\n`;
  const root = createRepo({ "src/physical.ts": content });
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const report = checkSourceSize({ cwd: root });

  assert.match(report.errors.join("\n"), /src\/physical\.ts: 301 lines/i);
});
