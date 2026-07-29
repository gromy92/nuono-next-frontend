import assert from 'node:assert/strict'
import { createLatestRequestGate } from './latestRequestGate'

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

async function runGuardedRequest(
  gate: ReturnType<typeof createLatestRequestGate<string>>,
  scope: string,
  request: Promise<string>,
  events: string[]
) {
  const identity = gate.begin(scope)
  const value = await request
  if (gate.isCurrent(identity, scope)) {
    events.push(value)
  }
}

const sameScopeGate = createLatestRequestGate<string>()
const slowRefresh = deferred<string>()
const fastRefresh = deferred<string>()
const sameScopeEvents: string[] = []

const slowRefreshRun = runGuardedRequest(sameScopeGate, 'session-1:owner-307', slowRefresh.promise, sameScopeEvents)
const fastRefreshRun = runGuardedRequest(sameScopeGate, 'session-1:owner-307', fastRefresh.promise, sameScopeEvents)

fastRefresh.resolve('latest-refresh')
await fastRefreshRun
slowRefresh.resolve('stale-refresh')
await slowRefreshRun
assert.deepEqual(sameScopeEvents, ['latest-refresh'])

const ownerSwitchGate = createLatestRequestGate<string>()
const ownerARequest = deferred<string>()
const ownerAEvents: string[] = []
const ownerARun = runGuardedRequest(ownerSwitchGate, 'session-1:owner-A', ownerARequest.promise, ownerAEvents)

const ownerBIdentity = ownerSwitchGate.begin('session-1:owner-B')
assert.equal(ownerSwitchGate.isCurrent(ownerBIdentity, 'session-1:owner-B'), true)
assert.equal(ownerSwitchGate.isCurrent(ownerBIdentity, 'session-1:owner-A'), false)

ownerARequest.resolve('owner-A-data')
await ownerARun
assert.deepEqual(ownerAEvents, [])

const roundTripGate = createLatestRequestGate<string>()
const firstOwnerAIdentity = roundTripGate.begin('session-1:owner-A')
roundTripGate.invalidate()
const secondOwnerAIdentity = roundTripGate.begin('session-1:owner-A')
assert.equal(roundTripGate.isCurrent(firstOwnerAIdentity, 'session-1:owner-A'), false)
assert.equal(roundTripGate.isCurrent(secondOwnerAIdentity, 'session-1:owner-A'), true)
