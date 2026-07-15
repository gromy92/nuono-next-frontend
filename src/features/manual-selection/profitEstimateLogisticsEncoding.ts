const CP1252_BYTE_BY_CHAR: Record<string, number> = {
  '€': 0x80,
  '‚': 0x82,
  'ƒ': 0x83,
  '„': 0x84,
  '…': 0x85,
  '†': 0x86,
  '‡': 0x87,
  'ˆ': 0x88,
  '‰': 0x89,
  'Š': 0x8a,
  '‹': 0x8b,
  'Œ': 0x8c,
  'Ž': 0x8e,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '˜': 0x98,
  '™': 0x99,
  'š': 0x9a,
  '›': 0x9b,
  'œ': 0x9c,
  'ž': 0x9e,
  'Ÿ': 0x9f
}

const MOJIBAKE_LEAD_PATTERN = /[ÃÂâæçäåèé]/
const CJK_PATTERN = /[\u3400-\u9fff]/

function byteFromCp1252Char(char: string) {
  const mapped = CP1252_BYTE_BY_CHAR[char]
  if (mapped !== undefined) {
    return mapped
  }
  const code = char.charCodeAt(0)
  return code <= 0xff ? code : undefined
}

function decodeCp1252Utf8Segment(value: string) {
  if (!MOJIBAKE_LEAD_PATTERN.test(value)) {
    return value
  }
  const bytes: number[] = []
  for (const char of value) {
    const byte = byteFromCp1252Char(char)
    if (byte === undefined) {
      return value
    }
    bytes.push(byte)
  }
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes))
    return CJK_PATTERN.test(decoded) ? decoded : value
  } catch {
    return value
  }
}

export function normalizeLogisticsQuoteText(value?: string | null) {
  if (!value) {
    return ''
  }
  let currentSegment = ''
  let normalized = ''
  for (const char of value.trim()) {
    if (byteFromCp1252Char(char) !== undefined) {
      currentSegment += char
      continue
    }
    normalized += decodeCp1252Utf8Segment(currentSegment)
    currentSegment = ''
    normalized += char
  }
  normalized += decodeCp1252Utf8Segment(currentSegment)
  return normalized.trim()
}
