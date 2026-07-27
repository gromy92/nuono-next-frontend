import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { aiListingDraftPatch } from './productListingAiDraft'

const apiSource = readFileSync(new URL('./api.ts', import.meta.url), 'utf8')
const listingPreviewSource = readFileSync(
  new URL('./ProductListingAiResultPreview.tsx', import.meta.url),
  'utf8'
)

assert.deepEqual(
  aiListingDraftPatch(
    { productTitleEn: 'Vintage Scrapbook Paper', productTitleAr: 'ورق سكراب بوك عتيق' },
    {
      english: ['Vintage Scrapbook Paper', 'vintage scrapbook paper', 'Lace Edge Paper'],
      arabic: ['ورق سكراب بوك', 'ورق سكراب بوك']
    }
  ),
  {
    productTitleEn: 'Vintage Scrapbook Paper',
    productTitleAr: 'ورق سكراب بوك عتيق',
    listingKeywordSuggestionsEn: ['Vintage Scrapbook Paper', 'Lace Edge Paper'],
    listingKeywordSuggestionsAr: ['ورق سكراب بوك']
  },
  'AI apply must carry deduplicated keyword suggestions into the client-side draft'
)

assert.ok(
  apiSource.includes('/api/product-listing/drafts/with-keyword-suggestions') &&
    apiSource.includes('/keyword-suggestions') &&
    apiSource.includes('splitKeywordSuggestions'),
  'draft save/load must persist keyword suggestions separately from the Noon upload draft contract'
)

assert.ok(
  listingPreviewSource.includes('data.keywords?.english') &&
    listingPreviewSource.includes('data.keywords?.arabic'),
  'Listing optimization must continue to show bilingual keyword suggestions'
)
