import type { ProductStockSourceChainSegment } from './statisticsDomain'

export function sourceStageLabel(stage: ProductStockSourceChainSegment['stage']) {
  switch (stage) {
    case 'ASN':
      return 'ASN'
    case 'LOGISTICS':
      return '物流'
    case 'PURCHASE_ORDER':
      return '采购单'
    default:
      return '来源'
  }
}

export function sourceSegmentStatusLabel(status: ProductStockSourceChainSegment['status']) {
  switch (status) {
    case 'MATCHED':
      return '已分摊'
    case 'CANDIDATE':
      return '候选关系'
    case 'UNMATCHED':
      return '未匹配'
    case 'RELATION_MISSING':
    case 'WAITING_RELATION':
      return '未建立关系'
    default:
      return '-'
  }
}

export function sourceSegmentTagColor(status: ProductStockSourceChainSegment['status']) {
  switch (status) {
    case 'MATCHED':
      return 'blue'
    case 'CANDIDATE':
      return 'cyan'
    case 'UNMATCHED':
      return 'orange'
    default:
      return 'default'
  }
}

export function sourceSegmentColor(segment: ProductStockSourceChainSegment, index: number) {
  if (segment.status === 'UNMATCHED') {
    return '#94a3b8'
  }
  if (segment.status === 'RELATION_MISSING' || segment.status === 'WAITING_RELATION') {
    return '#cbd5e1'
  }
  const palette = segment.status === 'CANDIDATE'
    ? ['#0891b2', '#0d9488', '#0284c7', '#059669', '#7c3aed', '#db2777']
    : ['#2563eb', '#16a34a', '#f97316', '#7c3aed', '#0891b2', '#db2777']
  return palette[index % palette.length]
}
