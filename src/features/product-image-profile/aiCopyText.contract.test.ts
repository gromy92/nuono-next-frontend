import assert from 'node:assert/strict'
import {
  buildProductImageAiPromptSections,
  buildProductImageShortTitleEn
} from './aiCopyText'
import { resolveProductImageShortTitleEn } from './productImageTitle'

const shortTitle = buildProductImageShortTitleEn('5 Pieces Double Sided Adhesive Packaging Tape Set (10mm x 10m)')
const mainPrompt = buildProductImageAiPromptSections({
  productTitle: 'Long fallback product title that should not replace the edited title',
  titleEn: shortTitle
}).find((section) => section.key === 'MAIN')

assert.equal(shortTitle, 'Double Sided Adhesive Packaging Tape Set')
assert.match(mainPrompt?.text ?? '', /英文短标题：Double Sided Adhesive Packaging Tape Set/)
assert.equal(
  resolveProductImageShortTitleEn('Hook and Loop Tape Strips', 'Fallback product title'),
  'Hook and Loop Tape Strips'
)
assert.equal(
  resolveProductImageShortTitleEn('', '5 Pieces Double Sided Adhesive Packaging Tape Set (10mm x 10m)'),
  'Double Sided Adhesive Packaging Tape Set'
)
