import type { SourceCollectionFormValue } from '../source-collection/types'
import type { CreateFromUrlExtra } from './types'
import {
  inferManualSelectionPlatform,
  manualSelectionPausedPlatformMessage,
  supportedManualSelectionPlatform
} from './utils'

export function buildManualSelectionUrlCollectionValue(
  url: string,
  extraValues?: CreateFromUrlExtra
): SourceCollectionFormValue {
  const platform = inferManualSelectionPlatform(url)
  const pausedMessage = manualSelectionPausedPlatformMessage(platform)
  if (pausedMessage) {
    throw new Error(pausedMessage)
  }
  if (!supportedManualSelectionPlatform(platform)) {
    throw new Error('当前只支持 Noon 和 Amazon 链接；SHEIN 完整采集暂缓。')
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
