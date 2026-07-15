import assert from 'node:assert/strict'
import { buildProductImageAiPromptSections, buildProductImageShortTitleEn } from './aiCopyText'

const shortTitle = buildProductImageShortTitleEn('5 Pieces Double Sided Adhesive Packaging Tape Set (10mm x 10m)')
const mainPrompt = buildProductImageAiPromptSections({
  productTitle: 'Long fallback product title that should not replace the edited title',
  titleEn: shortTitle
}).find((section) => section.key === 'MAIN')

assert.equal(shortTitle, 'Double Sided Adhesive Packaging Tape Set')
assert.match(mainPrompt?.text ?? '', /英文短标题：Double Sided Adhesive Packaging Tape Set/)
