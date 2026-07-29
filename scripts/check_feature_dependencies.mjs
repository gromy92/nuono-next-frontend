import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import ts from 'typescript'

const root = process.cwd()
const sourceRoot = join(root, 'src')
const featuresRoot = process.env.FEATURE_DEPENDENCY_ROOT
  ? resolve(root, process.env.FEATURE_DEPENDENCY_ROOT)
  : join(root, 'src/features')
const transportAuditRoot = process.env.FEATURE_DEPENDENCY_ROOT
  ? featuresRoot
  : sourceRoot
const transportImplementation = join(sourceRoot, 'shared/apiTransportRuntime.ts')
const auditOnly = process.argv.includes('--audit')
const allowedFeatureCycles = new Set()

function productionSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? productionSourceFiles(path) : [path]
    })
    .filter((path) => /\.(?:ts|tsx)$/u.test(path))
    .filter((path) => !/\.d\.ts$|(?:\.test|\.spec|\.contract(?:\.fixtures)?)\.(?:ts|tsx)$/u.test(path))
}

function sourceImports(filePath) {
  const source = ts.createSourceFile(
    filePath,
    readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    extname(filePath) === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )
  const imports = []
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      && node.moduleSpecifier
      && ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push({
        specifier: node.moduleSpecifier.text,
        runtime: !isTypeOnlyDeclaration(node),
        dynamic: false
      })
    }
    if (
      ts.isCallExpression(node)
      && node.expression.kind === ts.SyntaxKind.ImportKeyword
      && node.arguments.length === 1
      && ts.isStringLiteral(node.arguments[0])
    ) {
      imports.push({
        specifier: node.arguments[0].text,
        runtime: true,
        dynamic: true
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return imports
}

function nativeFetchReferences(filePath) {
  if (filePath === transportImplementation) {
    return []
  }
  const source = ts.createSourceFile(
    filePath,
    readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    extname(filePath) === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )
  const references = []
  function visit(node) {
    const directFetchCall =
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === 'fetch'
    const nativeFetchProperty =
      ts.isPropertyAccessExpression(node)
      && node.name.text === 'fetch'
      && ts.isIdentifier(node.expression)
      && ['globalThis', 'window'].includes(node.expression.text)
    if (directFetchCall || nativeFetchProperty) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart(source))
      references.push(`${relative(root, filePath)}:${line + 1}`)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return references
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

function isRouteLoaderAdapterEdge(sourceFeature, targetFeature, imported) {
  return (
    imported.dynamic
    && sourceFeature === 'route-catalog'
    && targetFeature !== 'route-catalog'
  )
}

const files = productionSourceFiles(featuresRoot)
const nativeFetchBypasses = productionSourceFiles(transportAuditRoot)
  .flatMap(nativeFetchReferences)
const knownFiles = new Set(files)
const runtimeEdges = new Map(files.map((file) => [file, new Set()]))
const featureEdges = new Map()
const appShellReverseDependencies = []
const routeLoaderAdapterEdges = []
const orderOwnershipViolations = []

for (const file of files) {
  const sourceFeature = featureName(file)
  if (!featureEdges.has(sourceFeature)) {
    featureEdges.set(sourceFeature, new Set())
  }
  for (const imported of sourceImports(file)) {
    const target = resolveRelativeImport(file, imported.specifier)
    if (!target || !knownFiles.has(target)) {
      continue
    }
    const targetFeature = featureName(target)
    if (isRouteLoaderAdapterEdge(sourceFeature, targetFeature, imported)) {
      routeLoaderAdapterEdges.push(
        `${relative(root, file)} -> ${relative(root, target)}`
      )
      continue
    }
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
      if (
        targetFeature === 'purchase-order'
        && ['warehouse-dispatch', 'warehouse-logistics-bill'].includes(sourceFeature)
      ) {
        orderOwnershipViolations.push(
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
orderOwnershipViolations.sort().forEach((dependency) => {
  issues.push(`warehouse implementation depends on purchase-order owner: ${dependency}`)
})
nativeFetchBypasses.sort().forEach((reference) => {
  issues.push(`native fetch bypasses shared HTTP transport: ${reference}`)
})

console.log(
  `Feature dependency policy: ${files.length} production files, `
    + `${runtimeCycles.length} runtime cycles, ${featureCycles.length} feature cycles, `
    + `${routeLoaderAdapterEdges.length} route loader adapter edges, `
    + `${nativeFetchBypasses.length} native fetch bypasses.`
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
