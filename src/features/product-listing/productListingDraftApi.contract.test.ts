import assert from 'node:assert/strict'
import { fetchProductListingDraft } from './api'
import type { ProductListingDraftView } from './types'

const originalFetch = globalThis.fetch
const draft: ProductListingDraftView = {
  draftId: 10033,
  draftNo: 'PLD-10033',
  storeCode: 'STR245027-NSA',
  status: 'ready_for_dry_run',
  draft: {
    storeCode: 'STR245027-NSA',
    psku: 'PSKU-10033',
    imageUrls: ['https://example.com/main.jpg'],
    listingKeywordSuggestionsEn: ['existing english keyword'],
    listingKeywordSuggestionsAr: ['كلمة موجودة']
  },
  validationIssues: []
}
let draftResponse = () => Response.json(draft)
let keywordSuggestionResponse = () => Response.json(
  { message: 'Keyword suggestions are temporarily unavailable' },
  { status: 503 }
)

globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input)
  if (url.endsWith('/keyword-suggestions')) {
    return keywordSuggestionResponse()
  }
  if (url === '/api/product-listing/drafts/10033') {
    return draftResponse()
  }
  return Response.json({ message: `Unexpected request: ${url}` }, { status: 404 })
}) as typeof fetch

try {
  assert.deepEqual(
    await fetchProductListingDraft(10033),
    draft,
    'an optional keyword-suggestion failure must not block or overwrite the authoritative draft'
  )

  keywordSuggestionResponse = () => Response.json({
    draftId: 10033,
    items: [
      { keyword: 'fresh english keyword', keywordNorm: 'fresh english keyword', locale: 'en-US' },
      { keyword: 'كلمة جديدة', keywordNorm: 'كلمة جديدة', locale: 'ar-SA' }
    ]
  })
  const enrichedDraft = await fetchProductListingDraft(10033)
  assert.deepEqual(
    enrichedDraft.draft?.listingKeywordSuggestionsEn,
    ['fresh english keyword'],
    'available keyword suggestions must still enrich the authoritative draft'
  )
  assert.deepEqual(enrichedDraft.draft?.listingKeywordSuggestionsAr, ['كلمة جديدة'])

  draftResponse = () => Response.json({ message: 'Draft not found' }, { status: 404 })
  await assert.rejects(
    fetchProductListingDraft(10033),
    (error: unknown) => error instanceof Error && error.message === 'Draft not found',
    'the authoritative draft failure must still reject even when suggestions are available'
  )
} finally {
  globalThis.fetch = originalFetch
}
