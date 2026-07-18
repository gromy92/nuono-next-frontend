export type RouteDefinitionReference = {
  readonly key: string
  readonly tabKey?: string
}

export type GrantRuleReference = {
  readonly keys: readonly string[]
}

export function routeReferenceIntegrityIssues(
  definitions: Readonly<Record<string, RouteDefinitionReference>>,
  grantRules: readonly GrantRuleReference[]
) {
  const issues: string[] = []
  const knownKeys = new Set(Object.keys(definitions))

  for (const [recordKey, definition] of Object.entries(definitions)) {
    if (definition.key !== recordKey) {
      issues.push(`route key mismatch: ${recordKey} != ${definition.key}`)
    }
    if (definition.tabKey && !knownKeys.has(definition.tabKey)) {
      issues.push(`unknown tab key for ${recordKey}: ${definition.tabKey}`)
    }
  }

  for (const rule of grantRules) {
    for (const key of rule.keys) {
      if (!knownKeys.has(key)) {
        issues.push(`unknown grant target: ${key}`)
      }
    }
  }

  return issues
}
