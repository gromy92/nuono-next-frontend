import { strict as assert } from 'node:assert'
import {
  asnProductPreflightInvalidLines,
  asnProductPreflightReasonText,
  matchesAsnProductPreflightInvalidLine,
  OFFICIAL_WAREHOUSE_ASN_PRODUCT_PREFLIGHT_FAILED
} from './asnProductPreflightFailure'

const invalidLines = asnProductPreflightInvalidLines({
  code: OFFICIAL_WAREHOUSE_ASN_PRODUCT_PREFLIGHT_FAILED,
  message: '所选商品尚未全部通过 Noon 身份与 pbarcode 预检，未创建 ASN。',
  details: {
    invalidLines: [
      { partnerSku: 'SGGRB290', pskuCode: 'N700123', reasonCode: 'PBARCODE_UNMAPPED' },
      { partnerSku: 'SGGRB291', pskuCode: 'N700124', reasonCode: 'PSKU_MISMATCH' }
    ]
  }
})

assert.equal(invalidLines.length, 2)
assert.equal(asnProductPreflightReasonText(invalidLines[0]), 'Noon 未建立有效 pbarcode 映射')
assert.equal(asnProductPreflightReasonText(invalidLines[1]), 'Noon PSKU 与本地冻结值不一致')
assert.ok(matchesAsnProductPreflightInvalidLine({ partnerSku: 'sggrb290', pskuCode: 'OTHER' }, invalidLines[0]))
assert.ok(matchesAsnProductPreflightInvalidLine({ partnerSku: 'OTHER', pskuCode: 'n700124' }, invalidLines[1]))
assert.deepEqual(asnProductPreflightInvalidLines({ code: 'OTHER', message: '其他错误' }), [])
