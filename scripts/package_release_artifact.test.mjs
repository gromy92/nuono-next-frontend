import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  ArtifactError,
  buildManifest,
  inspectDist,
  packageReleaseArtifact,
  sha256File,
  sha256Tree
} from './package_release_artifact.mjs';

function githubEnv() {
  return {
    GITHUB_SHA: 'a'.repeat(40),
    GITHUB_EVENT_NAME: 'push',
    GITHUB_REF: 'refs/heads/master',
    GITHUB_REPOSITORY: 'gromy92/nuono-next-frontend',
    GITHUB_WORKFLOW: 'Frontend CI',
    GITHUB_RUN_ID: '123',
    GITHUB_RUN_ATTEMPT: '2'
  };
}

function createDist(root, base = '/ai/') {
  const dist = join(root, 'dist');
  mkdirSync(join(dist, 'assets'), { recursive: true });
  writeFileSync(
    join(dist, 'index.html'),
    `<script type="module" src="${base}assets/index-test.js"></script>`,
    'utf8'
  );
  writeFileSync(join(dist, 'assets/index-test.js'), 'console.log("ok")', 'utf8');
  return dist;
}

test('packages a production-base static archive with workflow provenance', () => {
  const root = mkdtempSync(join(tmpdir(), 'frontend-release-artifact-'));
  const dist = createDist(root);
  const output = join(root, 'out');
  const manifestPath = packageReleaseArtifact(
    dist,
    output,
    `nuono-next-frontend-${'a'.repeat(40)}`,
    githubEnv()
  );
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const archive = join(output, 'nuono-next-frontend-static.tgz');
  assert.equal(manifest.commit, 'a'.repeat(40));
  assert.equal(manifest.run_id, 123);
  assert.equal(manifest.frontend.main_chunk, '/ai/assets/index-test.js');
  assert.equal(manifest.frontend.dist_tree_sha256, sha256Tree(dist));
  assert.equal(manifest.files[0].sha256, sha256File(archive));
});

test('rejects a frontend build that does not target /ai/', () => {
  const root = mkdtempSync(join(tmpdir(), 'frontend-release-artifact-'));
  const dist = createDist(root, '/');
  assert.throws(() => inspectDist(dist), /NUONO_NEXT_PUBLIC_BASE_PATH/);
});

test('rejects provenance from a pull request', () => {
  const root = mkdtempSync(join(tmpdir(), 'frontend-release-artifact-'));
  const archive = join(root, 'frontend.tgz');
  writeFileSync(archive, 'archive');
  const env = githubEnv();
  env.GITHUB_EVENT_NAME = 'pull_request';
  assert.throws(
    () => buildManifest(archive, 'artifact', {}, env),
    ArtifactError
  );
});
