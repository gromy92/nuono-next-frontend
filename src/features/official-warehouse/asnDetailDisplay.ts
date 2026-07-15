type AsnDetailDisplaySource = {
  sourceType?: string
  lines?: unknown[]
}

export function isNoonBackofficeAsnWithoutSyncedLines(asn: AsnDetailDisplaySource) {
  return (asn.sourceType || '').trim().toUpperCase() === 'NOON_SYNC' && !asn.lines?.length
}
