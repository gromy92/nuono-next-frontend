import { strict as assert } from 'node:assert'
import { readStoredSession, SESSION_STORAGE_KEY } from './ShellSessionStorage'

const previousWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
const storedValues = new Map<string, string>()

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: {
      hostname: '127.0.0.1',
      pathname: '/purchase/listing',
      search: '?devSession=1&devStore=STR245027-NSA&devSite=SA'
    },
    localStorage: {
      getItem: (key: string) => storedValues.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storedValues.set(key, value)
      },
      removeItem: (key: string) => {
        storedValues.delete(key)
      },
      clear: () => {
        storedValues.clear()
      }
    }
  }
})

try {
  const session = readStoredSession()

  assert.equal(session?.currentStore?.projectName, 'xingyao')
  assert.equal(session?.currentStore?.storeCode, 'STR245027-NSA')
  assert.equal(session?.currentStore?.site, 'SA')
  assert.ok(
    session?.userStores?.some((store) => store.projectName === 'xingyao' && store.storeCode === 'STR245027-NSA' && store.site === 'SA'),
    'boss dev session should expose xingyao SA as a selectable store'
  )
  assert.ok(
    session?.grantedMenus?.some((menu) => menu.menuName === '商品上架'),
    'purchase listing dev session should expose listing menu'
  )
  assert.equal(
    session?.grantedMenus?.some((menu) => menu.menuName === '选品池'),
    false,
    'purchase listing dev session should not expose removed selection-pool menu'
  )

  const persistedSession = JSON.parse(storedValues.get(SESSION_STORAGE_KEY) || '{}')
  assert.equal(persistedSession.currentStore?.storeCode, 'STR245027-NSA')
  assert.equal(persistedSession.currentStore?.site, 'SA')
} finally {
  storedValues.clear()
  if (previousWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', previousWindowDescriptor)
  } else {
    delete (globalThis as { window?: unknown }).window
  }
}
