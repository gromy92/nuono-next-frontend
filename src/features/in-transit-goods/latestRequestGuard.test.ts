import assert from 'node:assert/strict'
import { createLatestRequestGuard } from './latestRequestGuard'

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve
  })
  return { promise, resolve }
}

async function runGuardedRequest<T>(
  guard: ReturnType<typeof createLatestRequestGuard>,
  request: Promise<T>,
  events: string[],
  label: string
) {
  const token = guard.begin()
  events.push(`loading:${label}`)
  const value = await request
  if (guard.isCurrent(token)) {
    events.push(`data:${value}`)
  }
  if (guard.isCurrent(token)) {
    events.push(`settled:${label}`)
  }
}

const guard = createLatestRequestGuard()
const oldRequest = deferred<string>()
const currentRequest = deferred<string>()
const events: string[] = []

const oldRun = runGuardedRequest(guard, oldRequest.promise, events, 'old')
const currentRun = runGuardedRequest(guard, currentRequest.promise, events, 'current')

oldRequest.resolve('old-result')
await oldRun
assert.deepEqual(events, ['loading:old', 'loading:current'])

currentRequest.resolve('current-result')
await currentRun
assert.deepEqual(events, [
  'loading:old',
  'loading:current',
  'data:current-result',
  'settled:current'
])

const invalidatedGuard = createLatestRequestGuard()
const invalidatedToken = invalidatedGuard.begin()
assert.equal(invalidatedGuard.isCurrent(invalidatedToken), true)
invalidatedGuard.invalidate()
assert.equal(invalidatedGuard.isCurrent(invalidatedToken), false)
