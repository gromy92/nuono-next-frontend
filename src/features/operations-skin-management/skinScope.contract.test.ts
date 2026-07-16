import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { operationsSkinScopeKey } from './skinScope'

const ae = {
  projectCode: 'PAPERSAY',
  projectName: 'PAPERSAY',
  storeCode: 'STR108065-NAE',
  site: 'AE'
}
const sa = {
  projectCode: 'PAPERSAY',
  projectName: 'PAPERSAY',
  storeCode: 'STR108065-KSA',
  site: 'SA'
}

assert.equal(operationsSkinScopeKey(ae), operationsSkinScopeKey(sa))
assert.equal(operationsSkinScopeKey({ storeCode: 'STR-ONLY' }), 'STR-ONLY')
assert.equal(operationsSkinScopeKey(null), '')

const pageSource = readFileSync(new URL('./OperationsSkinManagementPage.tsx', import.meta.url), 'utf8')
assert.match(pageSource, /const storeScopeKey = operationsSkinScopeKey\(currentStore\)/)
assert.match(pageSource, /const loadScope = `\$\{storeScopeKey\}/)
assert.match(pageSource, /\}, \[form, storeScopeKey\]\)/)
assert.doesNotMatch(pageSource, /\}, \[form, storeCode\]\)/)
