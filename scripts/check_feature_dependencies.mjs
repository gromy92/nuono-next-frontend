import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import ts from 'typescript'

const root = process.cwd()
const featuresRoot = join(root, 'src/features')
const auditOnly = process.argv.includes('--audit')
const allowedFeatureCycles = new Set([
  'procurement|profit-calculator',
  'purchase-order|replenishment-plan'
])

function productionSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? productionSourceFiles(path) : [path]
    })
    .filter((path) => /\.(?:ts|tsx)$/u.test(path))
    .filter((path) => !/\.d\.ts$|(?:\.test|\.spec|\.contract(?:\.fixtures)?)\.(?:ts|tsx)$/u.test(path))
}

function staticImports(filePath) {
  const source = ts.createSourceFile(
    filePath,
    readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    extname(filePath) === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )
  const imports = []
  source.statements.forEach((statement) => {
    if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) {
      return
    }
    if (!statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) {
      return
    }
    imports.push({
      specifier: statement.moduleSpecifier.text,
      runtime: !isTypeOnlyDeclaration(statement)
    })
  })
  return imports
}

function isTypeOnlyDeclaration(statement) {
  if (ts.isExportDeclaration(statement)) {
    return Boolean(statement.isTypeOnly)
  }
  const clause = statement.importClause
  if (!clause) {
    return false
  }
  if (clause.isTypeOnly) {
    return true
  }
  const bindings = clause.namedBindings
  return Boolean(
    !clause.name
      && bindings
      && ts.isNamedImports(bindings)
      && bindings.elements.length
      && bindings.elements.every((element) => element.isTypeOnly)
  )
}

function resolveRelativeImport(importer, specifier) {
  if (!specifier.startsWith('.')) {
    return null
  }
  const target = resolve(dirname(importer), specifier)
  const candidates = [
    target,
    `${target}.ts`,
    `${target}.tsx`,
    join(target, 'index.ts'),
    join(target, 'index.tsx')
  ]
  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

function stronglyConnectedComponents(nodes, edges) {
  let index = 0
  const indexes = new Map()
  const lowLinks = new Map()
  const stack = []
  const onStack = new Set()
  const components = []

  function connect(node) {
    indexes.set(node, index)
    lowLinks.set(node, index)
    index += 1
    stack.push(node)
    onStack.add(node)

    for (const dependency of edges.get(node) ?? []) {
      if (!indexes.has(dependency)) {
        connect(dependency)
        lowLinks.set(node, Math.min(lowLinks.get(node), lowLinks.get(dependency)))
      } else if (onStack.has(dependency)) {
        lowLinks.set(node, Math.min(lowLinks.get(node), indexes.get(dependency)))
      }
    }

    if (lowLinks.get(node) !== indexes.get(node)) {
      return
    }
    const component = []
    let member
    do {
      member = stack.pop()
      onStack.delete(member)
      component.push(member)
    } while (member !== node)
    components.push(component)
  }

  nodes.forEach((node) => {
    if (!indexes.has(node)) {
      connect(node)
    }
  })
  return components
}

function featureName(filePath) {
  return relative(featuresRoot, filePath).split(sep)[0]
}

function cycleKey(component) {
  return [...component].sort().join('|')
}

const files = productionSourceFiles(featuresRoot)
const knownFiles = new Set(files)
const runtimeEdges = new Map(files.map((file) => [file, new Set()]))
const featureEdges = new Map()
const appShellReverseDependencies = []

for (const file of files) {
  const sourceFeature = featureName(file)
  if (!featureEdges.has(sourceFeature)) {
    featureEdges.set(sourceFeature, new Set())
  }
  for (const imported of staticImports(file)) {
    const target = resolveRelativeImport(file, imported.specifier)
    if (!target || !knownFiles.has(target)) {
      continue
    }
    const targetFeature = featureName(target)
    if (imported.runtime) {
      runtimeEdges.get(file).add(target)
    }
    if (sourceFeature !== targetFeature) {
      featureEdges.get(sourceFeature).add(targetFeature)
      if (targetFeature === 'app-shell' && sourceFeature !== 'app-shell') {
        appShellReverseDependencies.push(
          `${relative(root, file)} -> ${relative(root, target)}`
        )
      }
    }
  }
}

const runtimeCycles = stronglyConnectedComponents(files, runtimeEdges)
  .filter((component) => component.length > 1)
const featureNames = [...featureEdges.keys()]
const featureCycles = stronglyConnectedComponents(featureNames, featureEdges)
  .filter((component) => component.length > 1)
const unexpectedFeatureCycles = featureCycles.filter(
  (component) => !allowedFeatureCycles.has(cycleKey(component))
)

const issues = []
runtimeCycles.forEach((component) => {
  issues.push(`runtime cycle: ${component.map((file) => relative(root, file)).sort().join(' <-> ')}`)
})
unexpectedFeatureCycles.forEach((component) => {
  issues.push(`feature cycle: ${cycleKey(component)}`)
})
appShellReverseDependencies.sort().forEach((dependency) => {
  issues.push(`business feature depends on app-shell: ${dependency}`)
})

console.log(
  `Feature dependency policy: ${files.length} production files, `
    + `${runtimeCycles.length} runtime cycles, ${featureCycles.length} feature cycles.`
)
if (featureCycles.length) {
  console.log(`Feature SCCs: ${featureCycles.map(cycleKey).sort().join(', ')}`)
}
if (issues.length) {
  console.error(issues.join('\n'))
  if (!auditOnly) {
    process.exit(1)
  }
} else {
  console.log('Feature dependency policy passed.')
}
