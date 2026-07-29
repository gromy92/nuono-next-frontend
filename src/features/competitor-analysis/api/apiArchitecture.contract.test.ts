import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

const facadeSource = readFileSync(
  'src/features/competitor-analysis/api.ts',
  'utf8'
)

assert.doesNotMatch(facadeSource, /\bapiFetch\b/)
assert.doesNotMatch(facadeSource, /function map(?:Detail|Dashboard)\b/)
assert.match(facadeSource, /from '\.\/api\/watchProductTransport'/)
assert.match(facadeSource, /from '\.\/api\/dashboardTransport'/)
assert.match(facadeSource, /from '\.\/api\/productChangeTransport'/)
assert.match(facadeSource, /from '\.\/api\/taskTransport'/)

const mapperSource = readFileSync(
  'src/features/competitor-analysis/api/watchProductMapper.ts',
  'utf8'
)
const transportSource = readFileSync(
  'src/features/competitor-analysis/api/watchProductTransport.ts',
  'utf8'
)

assert.match(mapperSource, /export function mapDetail\b/)
assert.doesNotMatch(mapperSource, /\bapiFetch\b/)
assert.match(transportSource, /\bapiFetch\b/)
assert.doesNotMatch(transportSource, /function normalizeRankStatus\b/)
