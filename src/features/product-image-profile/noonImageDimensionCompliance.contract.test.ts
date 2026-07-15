import assert from 'node:assert/strict'
import { noonImageDimensionCompliance } from './noonImageDimensionCompliance'

assert.equal(noonImageDimensionCompliance().status, 'UNKNOWN')
assert.equal(noonImageDimensionCompliance(660, 1320).status, 'PASS')
assert.equal(noonImageDimensionCompliance(659, 1200).status, 'FAIL')
assert.equal(noonImageDimensionCompliance(660, 1321).status, 'FAIL')
assert.match(noonImageDimensionCompliance(1247, 1706).detail, /格式、PPI、文件大小和色彩空间/)
