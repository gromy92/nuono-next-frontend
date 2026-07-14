import { readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const sourceRoot = path.join(root, 'src')
const testLoaderRegister = path.join(root, 'scripts', 'register_test_loaders.mjs')
const contractPattern = /(?:\.contract\.test|\.test|\.spec)\.tsx?$/

function collectTests(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const absolutePath = path.join(directory, entry.name)
      return entry.isDirectory() ? collectTests(absolutePath) : [absolutePath]
    })
    .filter((filePath) => contractPattern.test(filePath))
}

const tests = collectTests(sourceRoot).sort()

if (tests.length === 0) {
  console.error('No source contract tests were found under src/.')
  process.exit(1)
}

for (const [index, testPath] of tests.entries()) {
  const relativePath = path.relative(root, testPath)
  console.log(`[contract ${index + 1}/${tests.length}] ${relativePath}`)
  const result = spawnSync(process.execPath, [
    '--import',
    'tsx',
    '--import',
    testLoaderRegister,
    relativePath
  ], {
    cwd: root,
    env: process.env,
    stdio: 'inherit'
  })

  if (result.error) {
    console.error(result.error)
    process.exit(1)
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

console.log(`All ${tests.length} source contract tests passed.`)
