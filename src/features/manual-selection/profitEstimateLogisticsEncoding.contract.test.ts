import assert from 'node:assert/strict'
import { normalizeLogisticsQuoteText } from './profitEstimateLogisticsEncoding'

assert.equal(
  normalizeLogisticsQuoteText('æ˜“é€šç‰©æµ / æ˜“é€šæ²™ç‰¹ç©ºè¿ä¸€æ¡£ä»“åˆ°ä»“ 20260604'),
  '易通物流 / 易通沙特空运一档仓到仓 20260604'
)

assert.equal(
  normalizeLogisticsQuoteText('众鸫供应链 / 沙特空运专线 FBN利雅得（含送仓报价）'),
  '众鸫供应链 / 沙特空运专线 FBN利雅得（含送仓报价）'
)

assert.equal(normalizeLogisticsQuoteText(undefined), '')
