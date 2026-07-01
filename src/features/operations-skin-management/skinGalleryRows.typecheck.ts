import type { OperationsSkinView } from './types'
import { resolveOperationsSkinGalleryRows } from './skinGalleryRows'

const fallbackRows: OperationsSkinView[] = resolveOperationsSkinGalleryRows({
  rows: [],
  storeCode: 'STR108065-NAE',
  keyword: '',
  status: 'ALL'
})

const filteredRows: OperationsSkinView[] = resolveOperationsSkinGalleryRows({
  rows: fallbackRows,
  storeCode: 'STR108065-NAE',
  keyword: '白底',
  status: 'ACTIVE'
})

void filteredRows
