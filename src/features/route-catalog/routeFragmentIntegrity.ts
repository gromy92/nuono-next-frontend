export type RouteDefinitionFragment = {
  readonly owner: string
  readonly definitions: Readonly<Record<string, unknown>>
}

type FragmentDefinitions<Fragment> = Fragment extends {
  readonly definitions: infer Definitions
}
  ? Definitions
  : never

type UnionToIntersection<Union> = (
  Union extends unknown ? (value: Union) => void : never
) extends (value: infer Intersection) => void
  ? Intersection
  : never

export type MergedRouteDefinitionFragments<
  Fragments extends readonly RouteDefinitionFragment[]
> = UnionToIntersection<FragmentDefinitions<Fragments[number]>>

export function routeFragmentKeyOwnershipIssues(
  fragments: readonly RouteDefinitionFragment[]
) {
  const issues: string[] = []
  const ownerByKey = new Map<string, string>()

  for (const fragment of fragments) {
    for (const key of Object.keys(fragment.definitions)) {
      const existingOwner = ownerByKey.get(key)
      if (ownerByKey.has(key)) {
        issues.push(`duplicate route key ownership ${key}: ${existingOwner}, ${fragment.owner}`)
      } else {
        ownerByKey.set(key, fragment.owner)
      }
    }
  }

  return issues
}

export function mergeUniqueRouteDefinitionFragments<
  const Fragments extends readonly RouteDefinitionFragment[]
>(fragments: Fragments): MergedRouteDefinitionFragments<Fragments> {
  const issues = routeFragmentKeyOwnershipIssues(fragments)
  if (issues.length) {
    throw new Error(`Invalid route fragment ownership:\n${issues.join('\n')}`)
  }
  return Object.assign(
    {},
    ...fragments.map((fragment) => fragment.definitions)
  ) as MergedRouteDefinitionFragments<Fragments>
}
