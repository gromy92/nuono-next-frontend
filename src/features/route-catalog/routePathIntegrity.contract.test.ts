import { strict as assert } from 'node:assert'
import { routePathIntegrityIssues, type RoutePathMetadata } from './routePathIntegrity'

function route(key: string, path: string, routeAliases?: readonly string[]): RoutePathMetadata {
  return { key, path, routeAliases }
}

assert.deepEqual(
  routePathIntegrityIssues([
    route('reports', '/Reports/'),
    route('daily-report', '/reports/daily/')
  ]),
  [
    'shadowing route paths: reports canonical /reports is parent of daily-report canonical /reports/daily'
  ]
)

assert.deepEqual(
  routePathIntegrityIssues([
    route('orders', '/orders'),
    route('returns', '/returns', ['/orders/history'])
  ]),
  [
    'shadowing route paths: orders canonical /orders is parent of returns alias /orders/history'
  ]
)

assert.deepEqual(
  routePathIntegrityIssues([
    route('products', '/products', ['/shared']),
    route('reports', '/reports', ['/shared/daily'])
  ]),
  [
    'shadowing route paths: products alias /shared is parent of reports alias /shared/daily'
  ]
)

assert.deepEqual(
  routePathIntegrityIssues([
    route('catalog', '/catalog', ['/catalog/legacy', '/catalog/legacy/v2'])
  ]),
  [],
  'parent/child canonical aliases are valid when they resolve to the same menu key'
)

assert.deepEqual(
  routePathIntegrityIssues([
    route('catalog', '/catalog', ['/catalog'])
  ]),
  [
    'duplicate route path /catalog: catalog canonical /catalog, catalog alias /catalog'
  ],
  'an exact same-key alias remains invalid redundant metadata'
)
