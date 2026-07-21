export type RoutePathMetadata = {
  readonly key: string
  readonly path: string
  readonly routeAliases?: readonly string[]
}

type IndexedRoutePath = {
  readonly key: string
  readonly kind: 'canonical' | 'alias'
  readonly normalizedPath: string
}

function normalizeRoutePath(path: string) {
  return path.trim().toLowerCase().replace(/\/+$/, '') || '/'
}

function indexedRoutePaths(definitions: readonly RoutePathMetadata[]) {
  return definitions.flatMap((definition): IndexedRoutePath[] => [
    {
      key: definition.key,
      kind: 'canonical',
      normalizedPath: normalizeRoutePath(definition.path)
    },
    ...(definition.routeAliases ?? []).map((path) => ({
      key: definition.key,
      kind: 'alias' as const,
      normalizedPath: normalizeRoutePath(path)
    }))
  ])
}

function isStrictChildPath(candidate: IndexedRoutePath, parent: IndexedRoutePath) {
  return candidate.normalizedPath.startsWith(`${parent.normalizedPath}/`)
}

function describeRoutePath(routePath: IndexedRoutePath) {
  return `${routePath.key} ${routePath.kind} ${routePath.normalizedPath}`
}

export function routePathIntegrityIssues(definitions: readonly RoutePathMetadata[]) {
  const issues: string[] = []
  const paths = indexedRoutePaths(definitions)

  for (let leftIndex = 0; leftIndex < paths.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < paths.length; rightIndex += 1) {
      const left = paths[leftIndex]
      const right = paths[rightIndex]
      if (left.normalizedPath === right.normalizedPath) {
        issues.push(
          `duplicate route path ${left.normalizedPath}: ${describeRoutePath(left)}, ${describeRoutePath(right)}`
        )
        continue
      }
      // Parent/child aliases of one menu still resolve to the same target and are intentionally valid.
      if (left.key === right.key) {
        continue
      }
      const parent = isStrictChildPath(right, left)
        ? left
        : isStrictChildPath(left, right)
          ? right
          : null
      if (parent) {
        const child = parent === left ? right : left
        issues.push(
          `shadowing route paths: ${describeRoutePath(parent)} is parent of ${describeRoutePath(child)}`
        )
      }
    }
  }

  return issues
}
