import type {
  ProductSelectionSourceCollection,
  SourceCollectionFormValue
} from '../source-collection/types'
import type {
  CreateFromUrlExtra,
  ManualSelectionSearchValues
} from './types'
import {
  inferManualSelectionPlatform,
  normalizeManualSelectionKeyword,
  supportedManualSelectionPlatform
} from './utils'

export function filterManualSelectionCollections(
  collections: ProductSelectionSourceCollection[],
  filters: ManualSelectionSearchValues
) {
  const channel = filters.channel
  const titleEn = normalizeManualSelectionKeyword(filters.productTitleEn)
  const titleCn = normalizeManualSelectionKeyword(filters.productTitleCn)
  const collectStatus = filters.collectStatus

  return collections.filter((item) => {
    if (channel && item.sourcePlatform !== channel) {
      return false
    }
    if (collectStatus && item.status !== collectStatus) {
      return false
    }
    if (titleEn && !normalizeManualSelectionKeyword(item.sourceTitle).includes(titleEn)) {
      return false
    }
    const cnSearchText = [item.sourceTitleCn, item.selectedText, item.notes].filter(Boolean).join(' ')
    if (titleCn && !normalizeManualSelectionKeyword(cnSearchText).includes(titleCn)) {
      return false
    }
    return true
  })
}

export function buildManualSelectionUrlCollectionValue(
  url: string,
  extraValues?: CreateFromUrlExtra
): SourceCollectionFormValue {
  const platform = inferManualSelectionPlatform(url)
  if (!supportedManualSelectionPlatform(platform)) {
    throw new Error('当前只支持 Noon、Amazon 和 SHEIN 链接。')
  }
  return {
    sourceType: 'marketplace-url',
    sourcePlatform: platform,
    sourceUrl: url,
    pageUrl: url,
    sourceTitleCn: extraValues?.titleCn,
    selectedText: extraValues?.titleCn
  }
}
