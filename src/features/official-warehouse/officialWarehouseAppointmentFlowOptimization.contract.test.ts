import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))
const pageSource = readFileSync(join(currentDir, 'OfficialWarehousePage.tsx'), 'utf8')
const apiSource = readFileSync(join(currentDir, 'api.ts'), 'utf8')

assert.match(apiSource, /partnerSkus\?: string\[\]/, 'candidate API should accept exact batch PSKU search')
assert.match(apiSource, /validateOfficialWarehouseAsn/, 'frontend should call the read-only ASN validation endpoint')
assert.match(apiSource, /partialBatchConfirmed\?: boolean/, 'confirmed partial selection should be explicit on create')

assert.match(
  pageSource,
  /selectedCandidateByKey/,
  'selected candidates should be retained independently from the current result page'
)
assert.match(pageSource, /preserveSelectedRowKeys:\s*true/, 'table selection should survive client pagination')
assert.match(pageSource, /已选择 \{selectedCandidateKeys\.length\} 个商品/, 'modal should show the retained selection count')
assert.match(pageSource, /清空选择/, 'modal should let the operator clear retained selections')
assert.match(
  pageSource,
  /<Input\.TextArea[\s\S]*?placeholder="搜索 SKU \/ 批量粘贴 PSKU \/ 中文标题 \/ 英文标题"/,
  'batch PSKU search must use a textarea so pasted line breaks reach the exact-search parser'
)

assert.match(pageSource, /sourceType:\s*'ali1688'/, 'missing dimensions should save to the 1688 spec source')
assert.match(pageSource, /填写规格/, 'missing spec candidates should expose an inline maintenance action')

const candidateColumnsSource = pageSource.slice(
  pageSource.indexOf('const candidateColumns'),
  pageSource.indexOf('const lineColumns')
)
const productColumnSource = candidateColumnsSource.slice(
  candidateColumnsSource.indexOf("title: '商品'"),
  candidateColumnsSource.indexOf("title: 'Noon SKU'")
)
const noonSkuColumnSource = candidateColumnsSource.slice(
  candidateColumnsSource.indexOf("title: 'Noon SKU'"),
  candidateColumnsSource.indexOf("title: '尺寸 / 体积'")
)
assert.doesNotMatch(productColumnSource, /PSKU:/, 'PSKU should be removed from the product column')
assert.match(noonSkuColumnSource, /PSKU：\{displayPsku\(row\)\}/, 'PSKU should appear below Noon SKU')

assert.doesNotMatch(
  pageSource,
  /可多选；显示可约仓批次、已建ASN批次和已约仓批次；已使用批次排在下方并标注。/,
  'obsolete shipping batch explanation should be removed'
)
assert.match(pageSource, /当前选择未覆盖物流批次中的全部待约商品，可能造成漏约。/, 'partial selection warning copy should be stable')
assert.match(pageSource, /返回补选/, 'partial selection warning should allow returning to selection')
assert.match(pageSource, /确认继续/, 'partial selection warning should allow non-blocking continuation')
assert.match(
  pageSource,
  /该 ASN 在 Noon 后台创建，商品明细未同步，请前往 Noon 后台查看详情。/,
  'Noon backoffice ASN detail should explain why local product lines are unavailable'
)

const durationSource = pageSource.slice(
  pageSource.indexOf('function appointmentDurationText'),
  pageSource.indexOf('function appointmentDeliveryTimeText')
)
assert.doesNotMatch(durationSource, /attemptCount/, 'duration display must not depend on a non-zero attempt count')
assert.match(pageSource, /title: '约仓耗时'/, 'ASN list should expose appointment duration as a visible column')
