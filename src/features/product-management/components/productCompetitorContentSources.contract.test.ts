import {
  buildProductCompetitorContentSourceView,
  collectProductCompetitorContentTextItems,
  competitorContentTranslationInputText,
  initialSelectedCompetitorContentKeys,
  isNoonCompetitorContentSource,
  selectedCompetitorContentTexts
} from './productCompetitorContentSources'
import type { ProductCompetitorContentMaterial } from '../types/competitorContent'

const material: ProductCompetitorContentMaterial = {
  id: 'competitor-1',
  url: 'https://www.noon.com/saudi-en/classic-clear-case/p/',
  sourceHost: 'Noon',
  titleEn: 'Classic Clear Case for iPhone 15',
  titleAr: 'غطاء شفاف للايفون'
}

const source = buildProductCompetitorContentSourceView(material, 0)

if (source.label !== 'Noon') {
  throw new Error(`expected source label Noon, got ${source.label}`)
}

if (source.url !== material.url) {
  throw new Error('expected source url to be preserved for clickable navigation')
}

if (!isNoonCompetitorContentSource(source)) {
  throw new Error('expected Noon source to be eligible for competitor evidence')
}

const noonCodeSource = buildProductCompetitorContentSourceView({
  id: 'competitor-noon-code',
  url: 'https://www.noon.com/saudi-en/example/Z9F8E7D6C5/p/',
  titleEn: 'Noon title'
}, 0)

if (noonCodeSource.displayCode !== 'Z9F8E7D6C5') {
  throw new Error(`expected Noon Z code from URL, got ${noonCodeSource.displayCode}`)
}

const hostOnlySource = buildProductCompetitorContentSourceView({
  id: 'competitor-2',
  url: 'https://www.amazon.sa/dp/B0C1234567',
  titleEn: 'Amazon competitor title'
}, 1)

if (hostOnlySource.label !== 'amazon.sa') {
  throw new Error(`expected hostname fallback amazon.sa, got ${hostOnlySource.label}`)
}

if (hostOnlySource.displayCode !== 'B0C1234567') {
  throw new Error(`expected Amazon ASIN from URL, got ${hostOnlySource.displayCode}`)
}

if (isNoonCompetitorContentSource(hostOnlySource)) {
  throw new Error('expected Amazon source not to be eligible for Noon competitor evidence')
}

const textItems = collectProductCompetitorContentTextItems([material], 'title', 'EN')

if (textItems.length !== 1 || textItems[0].text !== 'Classic Clear Case for iPhone 15') {
  throw new Error(`expected only English title text item, got ${textItems.map((item) => item.text).join(' | ')}`)
}

if (textItems[0].source.label !== 'Noon' || textItems[0].source.url !== material.url) {
  throw new Error('expected competitor text item to keep clickable source metadata')
}

const arabicTextItems = collectProductCompetitorContentTextItems([material], 'title', 'AR')

if (arabicTextItems.length !== 1 || arabicTextItems[0].text !== 'غطاء شفاف للايفون') {
  throw new Error(`expected only Arabic title text item, got ${arabicTextItems.map((item) => item.text).join(' | ')}`)
}

const highlightItems = collectProductCompetitorContentTextItems([
  {
    ...material,
    id: 'competitor-highlights-1',
    sellingPointsEn: [
      'MagSafe compatible',
      'Raised edge protection',
      'Anti-yellowing clear back'
    ],
    sellingPointsAr: [
      'متوافق مع ماج سيف',
      'حماية للحواف'
    ]
  }
], 'highlights', 'EN')

if (highlightItems.length !== 1) {
  throw new Error(`expected one highlights row per competitor, got ${highlightItems.length}`)
}

if (highlightItems[0].text !== 'MagSafe compatible\nRaised edge protection\nAnti-yellowing clear back') {
  throw new Error(`expected highlights to be grouped in one competitor row, got ${highlightItems[0].text}`)
}

const selectableItems = [
  { ...textItems[0], key: 'noon-title', text: 'Noon selected title' },
  { ...textItems[0], key: 'amazon-title', text: 'Amazon unselected title' }
]

const initialSelectedKeys = initialSelectedCompetitorContentKeys(selectableItems)

if (initialSelectedKeys.length !== 2 || !initialSelectedKeys.includes('noon-title') || !initialSelectedKeys.includes('amazon-title')) {
  throw new Error(`expected competitor content to be selected by default, got ${initialSelectedKeys.join(',')}`)
}

const selectedTexts = selectedCompetitorContentTexts(selectableItems, ['noon-title'])

if (selectedTexts.length !== 1 || selectedTexts[0] !== 'Noon selected title') {
  throw new Error(`expected AI merge to use selected competitor text only, got ${selectedTexts.join(' | ')}`)
}

if (competitorContentTranslationInputText(selectableItems[1]) !== 'Amazon unselected title') {
  throw new Error('expected item translation to use that competitor row text')
}
