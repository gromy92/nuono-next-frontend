export type LatestRequestIdentity<Scope> = Readonly<{
  requestId: number
  scope: Scope
}>

export type LatestRequestGate<Scope> = {
  begin: (scope: Scope) => LatestRequestIdentity<Scope>
  isCurrent: (identity: LatestRequestIdentity<Scope>, currentScope: Scope) => boolean
  invalidate: () => void
}

export function createLatestRequestGate<Scope>(): LatestRequestGate<Scope> {
  let latestRequestId = 0

  return {
    begin: (scope) => ({
      requestId: ++latestRequestId,
      scope
    }),
    isCurrent: (identity, currentScope) =>
      identity.requestId === latestRequestId && Object.is(identity.scope, currentScope),
    invalidate: () => {
      latestRequestId += 1
    }
  }
}
