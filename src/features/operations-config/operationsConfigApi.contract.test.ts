import { strict as assert } from 'node:assert'
import * as operationsConfigApi from './api'

type FetchCall = {
  input: RequestInfo | URL
  init?: RequestInit
}

const previousFetch = globalThis.fetch
const previousWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
const calls: FetchCall[] = []
let responseFactory = (index: number) => Response.json({ requestIndex: index })

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: { hostname: 'localhost' },
    localStorage: {
      getItem: () => JSON.stringify({ userId: 307, roleId: 8, level: 1 })
    }
  }
})
globalThis.fetch = async (input, init) => {
  const index = calls.length
  calls.push({ input, init })
  return responseFactory(index)
}

const {
  OperationsConfigApiError,
  copyOperationConfigVersion,
  deleteOperationConfigVersion,
  disableOperationConfigVersion,
  fetchOperationConfigProductDimensionOptions,
  fetchOperationConfigScope,
  fetchOperationConfigVersionDetail,
  fetchOperationConfigVersions,
  publishOperationConfigVersion,
  updateOperationConfigVersion
} = operationsConfigApi

try {
  assert.deepEqual(Object.keys(operationsConfigApi).sort(), [
    'OperationsConfigApiError',
    'copyOperationConfigVersion',
    'deleteOperationConfigVersion',
    'disableOperationConfigVersion',
    'fetchOperationConfigProductDimensionOptions',
    'fetchOperationConfigScope',
    'fetchOperationConfigVersionDetail',
    'fetchOperationConfigVersions',
    'publishOperationConfigVersion',
    'updateOperationConfigVersion'
  ])

  assert.deepEqual(await fetchOperationConfigScope([7, 7, 9]), { requestIndex: 0 })
  assert.deepEqual(await fetchOperationConfigVersions(), { requestIndex: 1 })
  assert.deepEqual(await fetchOperationConfigVersionDetail('v/ 1'), { requestIndex: 2 })
  assert.deepEqual(await copyOperationConfigVersion('v/ 1'), { requestIndex: 3 })

  const updateInput = {
    configType: 'BUSINESS_CALENDAR',
    displayName: '版本一',
    summary: null,
    items: [{ itemName: '默认周期', defaultValue: '7' }]
  }
  assert.deepEqual(await updateOperationConfigVersion('draft/一', updateInput), { requestIndex: 4 })
  responseFactory = (index) => index === 5
    ? new Response(null, { status: 204 })
    : Response.json({ requestIndex: index })
  assert.equal(await deleteOperationConfigVersion('draft/一'), undefined)

  const publishInput = { ownerUserId: 307, storeCode: 'STR/SA', siteCode: 'SA', message: null }
  assert.deepEqual(await publishOperationConfigVersion('draft/一', publishInput), { requestIndex: 6 })
  const disableInput = { reason: '停用版本' }
  assert.deepEqual(await disableOperationConfigVersion('draft/一', disableInput), { requestIndex: 7 })
  assert.deepEqual(
    await fetchOperationConfigProductDimensionOptions({
      ownerUserId: 307,
      storeCode: 'STR/SA',
      siteCode: 'SA',
      bundleVersionId: 42,
      bossUserIds: [8, 8, 9],
      brandQuery: 'Paper Say',
      fulltypeQuery: 'Home/Kitchen',
      limit: 80
    }),
    { requestIndex: 8 }
  )

  const encodedDraft = encodeURIComponent('draft/一')
  assert.deepEqual(calls.map((call) => call.input), [
    '/api/operations-config/scope?bossUserIds=7&bossUserIds=7&bossUserIds=9',
    '/api/operations-config/versions',
    '/api/operations-config/versions/v%2F%201',
    '/api/operations-config/versions/v%2F%201/copies',
    `/api/operations-config/versions/${encodedDraft}`,
    `/api/operations-config/versions/${encodedDraft}`,
    `/api/operations-config/versions/${encodedDraft}/publish`,
    `/api/operations-config/versions/${encodedDraft}/disable`,
    '/api/operations-config/product-dimensions/options?ownerUserId=307&storeCode=STR%2FSA&siteCode=SA&bundleVersionId=42&bossUserIds=8&bossUserIds=8&bossUserIds=9&brandQuery=Paper+Say&fulltypeQuery=Home%2FKitchen&limit=80'
  ])
  assert.deepEqual(calls.map((call) => call.init?.method), [
    undefined,
    undefined,
    undefined,
    'POST',
    'PUT',
    'DELETE',
    'POST',
    'POST',
    undefined
  ])
  assert.equal(calls[3].init?.body, undefined)
  assert.equal(calls[4].init?.body, JSON.stringify(updateInput))
  assert.equal(calls[6].init?.body, JSON.stringify(publishInput))
  assert.equal(calls[7].init?.body, JSON.stringify(disableInput))
  for (const [index, call] of calls.entries()) {
    const headers = new Headers(call.init?.headers)
    assert.equal(headers.get('X-Nuono-Dev-Session-User-Id'), '307')
    assert.equal(headers.get('Content-Type'), [4, 6, 7].includes(index) ? 'application/json' : null)
  }

  responseFactory = () => Response.json({ message: '后端拒绝' }, { status: 409 })
  await assert.rejects(
    fetchOperationConfigVersions(),
    (error) => error instanceof OperationsConfigApiError
      && error.name === 'OperationsConfigApiError'
      && error.status === 409
      && error.message === '后端拒绝'
  )

  responseFactory = () => Response.json(
    {
      code: 'CONFIG_CONFLICT',
      message: '版本冲突',
      category: 'BUSINESS_VALIDATION',
      retryable: false,
      details: { versionNo: 'V1' }
    },
    { status: 409 }
  )
  await assert.rejects(
    fetchOperationConfigVersions(),
    (error) => error instanceof OperationsConfigApiError
      && error.problem?.code === 'CONFIG_CONFLICT'
      && error.problem.category === 'BUSINESS_VALIDATION'
      && error.problem.retryable === false
      && error.problem.details?.versionNo === 'V1'
  )

  responseFactory = () => new Response(null, { status: 503 })
  await assert.rejects(
    fetchOperationConfigVersions(),
    (error) => error instanceof OperationsConfigApiError
      && error.status === 503
      && error.message === '运营配置版本读取失败：503'
  )

  const abortError = new DOMException('cancelled', 'AbortError')
  globalThis.fetch = async () => Promise.reject(abortError)
  await assert.rejects(fetchOperationConfigVersions(), (error) => error === abortError)
} finally {
  globalThis.fetch = previousFetch
  if (previousWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', previousWindowDescriptor)
  } else {
    delete (globalThis as { window?: unknown }).window
  }
}
