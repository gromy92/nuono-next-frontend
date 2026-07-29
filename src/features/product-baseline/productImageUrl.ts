function hasImageExtension(value: string) {
  return /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(value)
}

function splitUrlSuffix(value: string) {
  const queryIndex = value.indexOf('?')
  const hashIndex = value.indexOf('#')
  let splitIndex = -1
  if (queryIndex >= 0 && hashIndex >= 0) {
    splitIndex = Math.min(queryIndex, hashIndex)
  } else {
    splitIndex = Math.max(queryIndex, hashIndex)
  }
  return splitIndex >= 0
    ? { base: value.slice(0, splitIndex), suffix: value.slice(splitIndex) }
    : { base: value, suffix: '' }
}

function stripLeadingSlashes(value: string) {
  return value.replace(/^\/+/, '')
}

function normalizeNoonOriginalPath(value: string) {
  return value.replace(/^original\/(p[zn]sku\/)/i, '$1').replace(/^p\/original\/(p[zn]sku\/)/i, 'p/$1')
}

function isNoonProductImagePath(value: string) {
  const lower = stripLeadingSlashes(normalizeNoonOriginalPath(value)).toLowerCase()
  return (
    lower.startsWith('pzsku/') ||
    lower.startsWith('pnsku/') ||
    lower.includes('|pzsku/') ||
    lower.includes('|pnsku/') ||
    lower.includes('%7cpzsku/') ||
    lower.includes('%7cpnsku/')
  )
}

function isNoonProductImageUrl(value: string) {
  const match = value.match(/^https?:\/\/f\.nooncdn\.com\/p\/(.+)$/i)
  return Boolean(match?.[1] && isNoonProductImagePath(match[1]))
}

export function normalizeProductImageUrl(value: unknown) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  const { base, suffix } = splitUrlSuffix(raw)
  let normalized = base
  const noonCdnMatch = normalized.match(/^(https?:\/\/f\.nooncdn\.com\/)(.*)$/i)
  if (noonCdnMatch) {
    const [, prefix, rawPath] = noonCdnMatch
    let path = stripLeadingSlashes(normalizeNoonOriginalPath(rawPath))
    if (!/^p\//i.test(path) && isNoonProductImagePath(path)) {
      path = `p/${path}`
    }
    normalized = `${prefix}${path}`
  } else {
    const path = stripLeadingSlashes(normalizeNoonOriginalPath(normalized))
    if (isNoonProductImagePath(path)) {
      normalized = `https://f.nooncdn.com/p/${path}`
    }
  }

  if (isNoonProductImageUrl(normalized)) {
    normalized = normalized.replace(/\|/g, '%7C')
    if (!hasImageExtension(normalized)) {
      normalized = `${normalized}.jpg`
    }
  }
  return `${normalized}${suffix}`
}
