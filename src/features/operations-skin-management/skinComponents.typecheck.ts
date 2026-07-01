import type { OperationsSkinComponentView } from './types'
import {
  fetchOperationsSkinAssetBlob,
  operationsSkinDownloadFilename
} from './api'
import {
  HERO_MAIN_COMPONENT_SLOTS,
  SUITE_IMAGE_COMPONENT_SLOT_GROUPS,
  countConfiguredSkinComponents,
  mergeOperationsSkinComponentSlots,
  mergeHeroMainComponentSlots,
  normalizeOperationsSkinComponentDrafts,
  normalizeHeroMainComponentDrafts
} from './skinDetailSuites'

const saved: OperationsSkinComponentView[] = [{
  templateRole: 'HERO_MAIN',
  componentKey: 'FRAME',
  imageUrl: '/operations-skins/papersay-components/01-frame-thin.png',
  x: 0,
  y: 0,
  width: 1247,
  height: 1706,
  zIndex: 40,
  required: true,
  locked: true
}]

const slotKeys: string[] = HERO_MAIN_COMPONENT_SLOTS.map((slot) => slot.componentKey)
const drafts: OperationsSkinComponentView[] = mergeHeroMainComponentSlots(saved)
const payload: OperationsSkinComponentView[] = normalizeHeroMainComponentDrafts(drafts)
const suiteDrafts: OperationsSkinComponentView[] = mergeOperationsSkinComponentSlots(saved)
const suitePayload: OperationsSkinComponentView[] = normalizeOperationsSkinComponentDrafts(suiteDrafts)
const suiteRequiredCount: number = SUITE_IMAGE_COMPONENT_SLOT_GROUPS.flatMap((group) => group.slots.filter((slot) => slot.required)).length
const suiteConfiguredCount: number = countConfiguredSkinComponents(
  suiteDrafts,
  SUITE_IMAGE_COMPONENT_SLOT_GROUPS.flatMap((group) => group.slots)
)
const downloadName: string = operationsSkinDownloadFilename('PAPERSAY 黄框主图皮肤', '边框图', '/operations-skins/papersay/01.png')
const blobPromise: Promise<Blob> = fetchOperationsSkinAssetBlob('/operations-skins/papersay/01.png')

void slotKeys
void payload
void suitePayload
void suiteRequiredCount
void suiteConfiguredCount
void downloadName
void blobPromise
