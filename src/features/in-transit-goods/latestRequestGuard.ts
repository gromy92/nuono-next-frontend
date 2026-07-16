export type LatestRequestGuard = {
  begin: () => number
  isCurrent: (token: number) => boolean
  invalidate: () => void
}

export function createLatestRequestGuard(): LatestRequestGuard {
  let currentToken = 0
  return {
    begin: () => ++currentToken,
    isCurrent: (token) => token === currentToken,
    invalidate: () => {
      currentToken += 1
    }
  }
}
