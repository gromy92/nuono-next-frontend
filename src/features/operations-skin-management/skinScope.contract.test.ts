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

const pageSource = [
  './components/OperationsSkinWorkbench.tsx',
  './hooks/useOperationsSkinEditor.ts',
  './hooks/useOperationsSkinList.ts'
].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8')).join('\n')
assert.match(pageSource, /const storeScopeKey = operationsSkinScopeKey\(currentStore\)/)
assert.match(pageSource, /const loadScope = `\$\{storeScopeKey\}/)
assert.match(pageSource, /\}, \[form, storeScopeKey\]\)/)
assert.doesNotMatch(pageSource, /\}, \[form, storeCode\]\)/)
