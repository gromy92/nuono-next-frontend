export type ProductTitleSharedKeyword = {
  key: string
  label: string
  competitorCount: number
}

export type ProductTitleKeywordHighlightPart = {
  text: string
  highlighted: boolean
}

const DEFAULT_MAX_KEYWORDS = 12
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'into',
  'is',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
  'without',
  'compatible'
])

export function extractSharedProductTitleKeywords(
  generatedTitle: string,
  competitorTitles: string[],
  options: { maxKeywords?: number } = {}
): ProductTitleSharedKeyword[] {
  const generatedTokens = tokenizeTitle(generatedTitle)
  if (!generatedTokens.length) {
    return []
  }

  const competitorTokenCounts = new Map<string, number>()
  competitorTitles.forEach((title) => {
    const uniqueCompetitorTokens = new Set(tokenizeTitle(title).map((token) => token.key))
    uniqueCompetitorTokens.forEach((key) => {
      competitorTokenCounts.set(key, (competitorTokenCounts.get(key) ?? 0) + 1)
    })
  })

  const seenKeys = new Set<string>()
  const maxKeywords = options.maxKeywords ?? DEFAULT_MAX_KEYWORDS
  const keywords: ProductTitleSharedKeyword[] = []
  for (const token of generatedTokens) {
    if (seenKeys.has(token.key)) {
      continue
    }
    const competitorCount = competitorTokenCounts.get(token.key) ?? 0
    if (!competitorCount) {
      continue
    }
    seenKeys.add(token.key)
    keywords.push({
      key: token.key,
      label: token.label,
      competitorCount
    })
    if (keywords.length >= maxKeywords) {
      break
    }
  }
  return keywords
}

export function normalizeProductTitleKeywordInput(value: string) {
  return tokenizeTitle(value).map((token) => token.label).join(' ')
}

export function parseProductTitleKeywordInputList(value: string) {
  const seenKeys = new Set<string>()
  return value
    .split(/[\n,，;；]+/u)
    .map(normalizeProductTitleKeywordInput)
    .filter((keyword) => {
      const key = keyword.toLocaleLowerCase()
      if (!key || seenKeys.has(key)) {
        return false
      }
      seenKeys.add(key)
      return true
    })
}

export function splitProductTitleKeywordHighlights(
  text: string,
  keywords: Array<ProductTitleSharedKeyword | string>
): ProductTitleKeywordHighlightPart[] {
  if (!text) {
    return []
  }

  const highlightKeywords = normalizeHighlightKeywords(keywords)
  if (!highlightKeywords.length) {
    return [{ text, highlighted: false }]
  }

  const loweredText = text.toLocaleLowerCase()
  const parts: ProductTitleKeywordHighlightPart[] = []
  let cursor = 0

  while (cursor < text.length) {
    const nextMatch = findNextHighlightMatch(text, loweredText, highlightKeywords, cursor)
    if (!nextMatch) {
      parts.push({ text: text.slice(cursor), highlighted: false })
      break
    }
    if (nextMatch.start > cursor) {
      parts.push({ text: text.slice(cursor, nextMatch.start), highlighted: false })
    }
    parts.push({ text: text.slice(nextMatch.start, nextMatch.end), highlighted: true })
    cursor = nextMatch.end
  }

  return parts
}

function tokenizeTitle(value: string) {
  return Array.from(value.matchAll(/[\p{L}\p{N}]+/gu))
    .map((match) => {
      const label = match[0].trim()
      return {
        key: label.toLocaleLowerCase(),
        label
      }
    })
    .filter((token) => token.key && isKeywordToken(token.key))
}

function isKeywordToken(value: string) {
  if (STOP_WORDS.has(value)) {
    return false
  }
  if (/^\d+$/.test(value)) {
    return value.length >= 2
  }
  return value.length >= 3
}

function normalizeHighlightKeywords(keywords: Array<ProductTitleSharedKeyword | string>) {
  const seen = new Set<string>()
  return keywords
    .map((keyword) => normalizeProductTitleKeywordInput(typeof keyword === 'string' ? keyword : keyword.label))
    .filter((label) => {
      const key = label.toLocaleLowerCase()
      if (!key || seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
    .map((label) => ({
      label,
      loweredLabel: label.toLocaleLowerCase()
    }))
    .sort((left, right) => right.label.length - left.label.length)
}

function findNextHighlightMatch(
  originalText: string,
  loweredText: string,
  keywords: Array<{ label: string; loweredLabel: string }>,
  fromIndex: number
) {
  let bestMatch: { start: number; end: number } | undefined

  keywords.forEach((keyword) => {
    let start = loweredText.indexOf(keyword.loweredLabel, fromIndex)
    while (start >= 0) {
      const end = start + keyword.loweredLabel.length
      if (isHighlightBoundary(originalText, start) && isHighlightBoundary(originalText, end)) {
        if (
          !bestMatch ||
          start < bestMatch.start ||
          (start === bestMatch.start && end - start > bestMatch.end - bestMatch.start)
        ) {
          bestMatch = { start, end }
        }
        break
      }
      start = loweredText.indexOf(keyword.loweredLabel, start + 1)
    }
  })

  return bestMatch
}

function isHighlightBoundary(text: string, index: number) {
  if (index <= 0 || index >= text.length) {
    return true
  }
  return !/[\p{L}\p{N}]/u.test(text.charAt(index - 1)) || !/[\p{L}\p{N}]/u.test(text.charAt(index))
}
