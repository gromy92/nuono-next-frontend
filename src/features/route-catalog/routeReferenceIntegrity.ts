export type RouteDefinitionReference = {
  readonly key: string
  readonly accessKey?: string
  readonly tabKey?: string
  readonly sectionKey?: string
  readonly workspaceMount?: unknown
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
    if (definition.accessKey && !knownKeys.has(definition.accessKey)) {
      issues.push(`unknown access key for ${recordKey}: ${definition.accessKey}`)
    }
    const declaresWorkspaceMount = Object.prototype.hasOwnProperty.call(definition, 'workspaceMount')
    const hasWorkspaceMount = typeof definition.workspaceMount === 'function'
    if (!declaresWorkspaceMount) {
      issues.push(`missing workspace mount for ${recordKey}`)
    } else if (!hasWorkspaceMount) {
      issues.push(`invalid workspace mount for ${recordKey}`)
    }
  }

  for (const rule of grantRules) {
    const targetSections = Array.from(
      new Set(
        rule.keys.flatMap((key) => {
          const sectionKey = definitions[key]?.sectionKey
          return sectionKey ? [sectionKey] : []
        })
      )
    )
    if (targetSections.length > 1) {
      issues.push(
        `cross-section grant rule ${rule.keys.join(', ')}: ${targetSections.join(', ')}`
      )
    }
    for (const key of rule.keys) {
      if (!knownKeys.has(key)) {
        issues.push(`unknown grant target: ${key}`)
      }
    }
  }

  return issues
}
