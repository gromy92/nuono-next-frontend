export type RouteDefinitionReference = {
  readonly key: string
  readonly tabKey?: string
  readonly sectionKey?: string
  readonly contentKind?: string
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
    if (definition.tabKey && knownKeys.has(definition.tabKey)) {
      const tabDefinition = definitions[definition.tabKey]
      if (
        definition.contentKind &&
        tabDefinition.contentKind &&
        definition.contentKind !== tabDefinition.contentKind
      ) {
        issues.push(
          `tab content mismatch for ${recordKey}: ${definition.contentKind} != ${definition.tabKey}:${tabDefinition.contentKind}`
        )
      }
    }
    const hasContentKind = typeof definition.contentKind === 'string'
    const declaresWorkspaceMount = Object.prototype.hasOwnProperty.call(definition, 'workspaceMount')
    const hasWorkspaceMount = typeof definition.workspaceMount === 'function'
    if (declaresWorkspaceMount && !hasWorkspaceMount) {
      issues.push(`invalid workspace mount for ${recordKey}`)
    }
    if (!hasContentKind && !declaresWorkspaceMount) {
      issues.push(`missing workspace mount strategy for ${recordKey}`)
    } else if (hasContentKind && declaresWorkspaceMount) {
      issues.push(`conflicting workspace mount strategies for ${recordKey}`)
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
