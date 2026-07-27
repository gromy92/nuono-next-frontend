#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export class ArtifactError extends Error {}

export function sha256File(path) {
  const digest = createHash('sha256');
  digest.update(readFileSync(path));
  return digest.digest('hex');
}

export function sha256Tree(root) {
  const files = [];
  const visit = (directory, prefix = '') => {
    for (const entry of readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0))) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath, relativePath);
      } else if (entry.isFile()) {
        files.push({ relativePath, absolutePath });
      } else {
        throw new ArtifactError(`unsupported dist entry: ${relativePath}`);
      }
    }
  };
  visit(root);
  const digest = createHash('sha256');
  for (const file of files) {
    digest.update(`${file.relativePath}\0${sha256File(file.absolutePath)}\0`);
    digest.update(`${statSync(file.absolutePath).size}\n`);
  }
  return digest.digest('hex');
}

function requiredEnv(name, env) {
  const value = String(env[name] ?? '').trim();
  if (!value) {
    throw new ArtifactError(`missing required environment variable: ${name}`);
  }
  return value;
}

export function inspectDist(distDir) {
  const indexPath = join(distDir, 'index.html');
  const indexHtml = readFileSync(indexPath, 'utf8');
  const match = indexHtml.match(/["']([^"']*assets\/index-[^"']+\.js)["']/);
  if (!match) {
    throw new ArtifactError('cannot find the production main chunk in dist/index.html');
  }
  const mainChunk = match[1];
  if (!mainChunk.startsWith('/ai/')) {
    throw new ArtifactError('frontend release build must use NUONO_NEXT_PUBLIC_BASE_PATH=/ai/');
  }
  const mainChunkPath = mainChunk.slice('/ai/'.length);
  const mainChunkFile = join(distDir, mainChunkPath);
  return {
    dist_tree_sha256: sha256Tree(distDir),
    index_sha256: sha256File(indexPath),
    main_chunk: mainChunk,
    main_chunk_path: mainChunkPath,
    main_chunk_sha256: sha256File(mainChunkFile)
  };
}

export function buildManifest(archivePath, artifactName, distInfo, env) {
  const commit = requiredEnv('GITHUB_SHA', env);
  if (!/^[0-9a-f]{40}$/.test(commit)) {
    throw new ArtifactError('GITHUB_SHA must be a full lowercase commit SHA');
  }
  const event = requiredEnv('GITHUB_EVENT_NAME', env);
  const ref = requiredEnv('GITHUB_REF', env);
  if (event !== 'push' || ref !== 'refs/heads/master') {
    throw new ArtifactError('release artifacts may only be produced by a push to master');
  }
  return {
    schema_version: 1,
    component: 'frontend',
    repository: requiredEnv('GITHUB_REPOSITORY', env),
    commit,
    ref,
    event,
    workflow: requiredEnv('GITHUB_WORKFLOW', env),
    run_id: Number(requiredEnv('GITHUB_RUN_ID', env)),
    run_attempt: Number(requiredEnv('GITHUB_RUN_ATTEMPT', env)),
    artifact_name: artifactName,
    deployable: true,
    frontend: distInfo,
    files: [{
      path: basename(archivePath),
      sha256: sha256File(archivePath),
      size: statSync(archivePath).size
    }]
  };
}

export function packageReleaseArtifact(distDir, outputDir, artifactName, env) {
  const distInfo = inspectDist(distDir);
  mkdirSync(outputDir, { recursive: false });
  const archivePath = join(outputDir, 'nuono-next-frontend-static.tgz');
  execFileSync('tar', [
    '-C',
    distDir,
    '-czf',
    archivePath,
    '.'
  ]);
  const manifest = buildManifest(archivePath, artifactName, distInfo, env);
  writeFileSync(
    join(outputDir, 'release-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  return join(outputDir, 'release-manifest.json');
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    values[argv[index]] = argv[index + 1];
  }
  if (!values['--dist'] || !values['--output']) {
    throw new ArtifactError('usage: --dist <directory> --output <directory>');
  }
  return {
    distDir: resolve(values['--dist']),
    outputDir: resolve(values['--output'])
  };
}

const isMain = process.argv[1]
  && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const artifactName = requiredEnv('RELEASE_ARTIFACT_NAME', process.env);
  console.log(packageReleaseArtifact(
    args.distDir,
    args.outputDir,
    artifactName,
    process.env
  ));
}
