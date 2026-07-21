import { strict as assert } from 'node:assert'
import type { ReactElement } from 'react'
import {
  LazyWorkspaceBoundary,
  createLazyWorkspaceMount,
  loadWorkspaceModuleWithRecovery
} from './workspaceMount'

const previousWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
let storedReloadMarker: string | null = null
let reloadCount = 0

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    sessionStorage: {
      getItem: () => storedReloadMarker,
      setItem: (_key: string, value: string) => {
        storedReloadMarker = value
      },
      removeItem: () => {
        storedReloadMarker = null
      }
    },
    location: {
      reload: () => {
        reloadCount += 1
      }
    }
  }
})

try {
  const TestWorkspace = () => null
  storedReloadMarker = '1'
  const loadedModule = await loadWorkspaceModuleWithRecovery(async () => ({ default: TestWorkspace }))
  assert.strictEqual(loadedModule.default, TestWorkspace)
  assert.equal(storedReloadMarker, null, 'a successful load must clear the reload marker')

  const firstLoadError = new Error('Failed to fetch dynamically imported module')
  await assert.rejects(
    loadWorkspaceModuleWithRecovery(async () => Promise.reject(firstLoadError)),
    (error) => error === firstLoadError
  )
  assert.equal(storedReloadMarker, '1')
  assert.equal(reloadCount, 1, 'the first matching failure must reload once')

  const secondLoadError = new Error('Importing a module script failed')
  await assert.rejects(
    loadWorkspaceModuleWithRecovery(async () => Promise.reject(secondLoadError)),
    (error) => error === secondLoadError
  )
  assert.equal(reloadCount, 1, 'the session marker must prevent a second reload')

  storedReloadMarker = null
  const unrelatedError = new Error('workspace render failed')
  await assert.rejects(
    loadWorkspaceModuleWithRecovery(async () => Promise.reject(unrelatedError)),
    (error) => error === unrelatedError
  )
  assert.equal(storedReloadMarker, null)
  assert.equal(reloadCount, 1, 'an unrelated failure must propagate without reloading')

  let loaderCalls = 0
  const mount = createLazyWorkspaceMount(async () => {
    loaderCalls += 1
    return { default: TestWorkspace }
  })
  assert.equal(Object.isFrozen(mount), true, 'a mount Adapter must be frozen at creation')
  assert.equal(loaderCalls, 0, 'creating a mount Adapter must not execute its loader')
  const mountElement = (mount as () => ReactElement)()
  assert.strictEqual(mountElement.type, LazyWorkspaceBoundary)
  assert.equal(loaderCalls, 0, 'creating the lazy React element must not execute its loader')
} finally {
  if (previousWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', previousWindowDescriptor)
  } else {
    delete (globalThis as { window?: unknown }).window
  }
}
