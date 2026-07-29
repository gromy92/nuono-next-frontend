#!/usr/bin/env node

import { readdirSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, relative } from 'node:path'
import process from 'node:process'
import {
  SOURCE_CONTRACT_QUALITY_CEILINGS,
  sourceContractQualityReport
} from './source_contract_quality_policy.mjs'

const root = process.cwd()
const sourceRoot = join(root, 'src')
const contractPattern = /(?:\.contract\.test|\.test|\.spec)\.tsx?$/u
const directReaderPattern = /\b(?:readFileSync|readdirSync)\b/u
const sourceFixturePattern = /(?:ContractSources|contractSources)/u

const currentSources = collectContractSources(sourceRoot)
const directReaders = matchingPaths(currentSources, directReaderPattern)
const sourceFixtures = matchingPaths(currentSources, sourceFixturePattern)
const baseRef = process.env.SOURCE_CONTRACT_BASE_REF?.trim()
const baseDirectReaders = baseRef ? gitMatchingPaths(baseRef, directReaderPattern) : undefined
const baseSourceFixtures = baseRef ? gitMatchingPaths(baseRef, sourceFixturePattern) : undefined

const report = sourceContractQualityReport({
  directReaders,
  sourceFixtures,
  baseDirectReaders,
  baseSourceFixtures
})

console.log(
  `Source-contract quality: ${report.counts.directReaders} direct readers / `
    + `${SOURCE_CONTRACT_QUALITY_CEILINGS.directReaders} ceiling, `
    + `${report.counts.sourceFixtures} source fixtures / `
    + `${SOURCE_CONTRACT_QUALITY_CEILINGS.sourceFixtures} ceiling, `
    + `${report.counts.implementationCoupled} coupled / `
    + `${SOURCE_CONTRACT_QUALITY_CEILINGS.implementationCoupled} ceiling.`
)

if (!report.ok) {
  report.errors.forEach((error) => console.error(`- ${error}`))
  process.exitCode = 1
} else {
  console.log('Source-contract quality policy passed.')
}

function collectContractSources(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      return collectContractSources(path)
    }
    return contractPattern.test(path)
      ? [[relative(root, path), readFileSync(path, 'utf8')]]
      : []
  })
}

function matchingPaths(sources, pattern) {
  return sources
    .flatMap(([path, source]) => pattern.test(source) ? [path] : [])
    .sort()
}

function gitMatchingPaths(ref, pattern) {
  if (!isCommit(ref)) {
    return undefined
  }
  const expression = pattern === directReaderPattern
    ? 'readFileSync|readdirSync'
    : 'ContractSources|contractSources'
  const result = spawnSync(
    'git',
    ['grep', '-l', '-E', expression, ref, '--', 'src'],
    { cwd: root, encoding: 'utf8' }
  )
  if (![0, 1].includes(result.status ?? 1)) {
    throw new Error(result.stderr.trim() || `git grep failed for ${ref}`)
  }
  return result.stdout
    .split(/\r?\n/u)
    .map((path) => path.trim())
    .map((path) => path.startsWith(`${ref}:`) ? path.slice(ref.length + 1) : path)
    .filter((path) => contractPattern.test(path))
    .sort()
}

function isCommit(ref) {
  const result = spawnSync(
    'git',
    ['rev-parse', '--verify', `${ref}^{commit}`],
    { cwd: root, stdio: 'ignore' }
  )
  return result.status === 0
}
