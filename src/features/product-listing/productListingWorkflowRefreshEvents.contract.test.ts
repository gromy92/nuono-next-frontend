import assert from 'node:assert/strict'
import { subscribeProductListingWorkflowRefresh } from './productListingWorkflowRefreshEvents'

const listeners = new Map<string, Set<() => void>>()
const target = {
  addEventListener(type: string, listener: () => void) {
    const handlers = listeners.get(type) ?? new Set<() => void>()
    handlers.add(listener)
    listeners.set(type, handlers)
  },
  removeEventListener(type: string, listener: () => void) {
    listeners.get(type)?.delete(listener)
  }
}

let refreshCount = 0
const unsubscribe = subscribeProductListingWorkflowRefresh(target, () => {
  refreshCount += 1
})

listeners.get('focus')?.forEach(listener => listener())
listeners.get('pageshow')?.forEach(listener => listener())
assert.equal(refreshCount, 2)

unsubscribe()
listeners.get('focus')?.forEach(listener => listener())
listeners.get('pageshow')?.forEach(listener => listener())
assert.equal(refreshCount, 2)
