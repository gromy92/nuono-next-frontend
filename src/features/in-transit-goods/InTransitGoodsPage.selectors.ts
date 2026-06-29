import type { InTransitGoodsLine } from './types'
import type { InTransitBoxGroup, InTransitProductGroup } from './InTransitGoodsPage.models'
import {
  firstBoxSpecValue,
  formatBoxSize,
  uniqueBoxSpecValue
} from './InTransitGoodsPage.utils'

export function buildBoxGroups(lines: InTransitGoodsLine[]): InTransitBoxGroup[] {
  const groups = new Map<string, InTransitGoodsLine[]>()
  lines.forEach((line) => {
    const boxNo = line.boxNo?.trim() || '未填写箱号'
    const current = groups.get(boxNo) ?? []
    current.push(line)
    groups.set(boxNo, current)
  })
  return Array.from(groups.entries()).map(([boxNo, groupLines]) => {
    const cartonValues = groupLines
      .map((line) => line.cartonCount)
      .filter((value): value is number => value !== null && value !== undefined)
    const packageLengthCm = firstBoxSpecValue(groupLines, (line) => line.packageLengthCm)
    const packageWidthCm = firstBoxSpecValue(groupLines, (line) => line.packageWidthCm)
    const packageHeightCm = firstBoxSpecValue(groupLines, (line) => line.packageHeightCm)
    const measuredLengthCm = firstBoxSpecValue(groupLines, (line) => line.measuredLengthCm)
    const measuredWidthCm = firstBoxSpecValue(groupLines, (line) => line.measuredWidthCm)
    const measuredHeightCm = firstBoxSpecValue(groupLines, (line) => line.measuredHeightCm)
    const packageWeight = firstBoxSpecValue(groupLines, (line) => line.packageWeightKg)
    const packageVolume = firstBoxSpecValue(groupLines, (line) => line.packageVolumeCbm)
    return {
      boxNo,
      externalBoxNo: firstBoxSpecValue(groupLines, (line) => line.externalBoxNo),
      packageTrackingNo: firstBoxSpecValue(groupLines, (line) => line.packageTrackingNo),
      packageStatus: firstBoxSpecValue(groupLines, (line) => line.packageStatus),
      logisticsStatus: firstBoxSpecValue(groupLines, (line) => line.logisticsStatus),
      lines: groupLines,
      pskuCount: new Set(groupLines.map((line) => line.psku).filter(Boolean)).size,
      shippedQuantityTotal: sumLines(groupLines, 'shippedQuantity'),
      receivedQuantityTotal: sumLines(groupLines, 'receivedQuantity'),
      remainingQuantityTotal: sumLines(groupLines, 'remainingQuantity'),
      cartonCountTotal: cartonValues.length ? cartonValues.reduce((total, value) => total + value, 0) : null,
      packageSpec: {
        sizeCm: formatBoxSize(packageLengthCm, packageWidthCm, packageHeightCm),
        weightKg: packageWeight === '-' ? uniqueBoxSpecValue(groupLines, (line) => line.cartonWeightKg) : packageWeight,
        volumeCbm: packageVolume === '-' ? uniqueBoxSpecValue(groupLines, (line) => line.cartonVolumeCbm) : packageVolume
      },
      measuredSpec: {
        sizeCm: formatBoxSize(measuredLengthCm, measuredWidthCm, measuredHeightCm),
        weightKg: firstBoxSpecValue(groupLines, (line) => line.measuredWeightKg),
        volumeCbm: firstBoxSpecValue(groupLines, (line) => line.measuredVolumeCbm)
      }
    }
  })
}

export function buildProductGroups(lines: InTransitGoodsLine[]): InTransitProductGroup[] {
  const groups = new Map<string, InTransitGoodsLine[]>()
  lines.forEach((line) => {
    const key = line.psku?.trim() || '未填写 PSKU'
    const current = groups.get(key) ?? []
    current.push(line)
    groups.set(key, current)
  })
  return Array.from(groups.entries()).map(([psku, groupLines]) => {
    const firstLine = groupLines[0]
    const cartonValues = groupLines
      .map((line) => line.cartonCount)
      .filter((value): value is number => value !== null && value !== undefined)
    return {
      psku,
      productTitle: firstLine?.productTitle,
      productName: firstLine?.productName,
      productImageUrl: firstLine?.productImageUrl,
      storeValues: Array.from(new Set(groupLines.map((line) => [line.storeCode, line.siteCode].filter(Boolean).join(' / ')).filter(Boolean))),
      lines: groupLines,
      boxCount: new Set(groupLines.map((line) => line.boxNo).filter(Boolean)).size,
      shippedQuantityTotal: sumLines(groupLines, 'shippedQuantity'),
      receivedQuantityTotal: sumLines(groupLines, 'receivedQuantity'),
      remainingQuantityTotal: sumLines(groupLines, 'remainingQuantity'),
      cartonCountTotal: cartonValues.length ? cartonValues.reduce((total, value) => total + value, 0) : null
    }
  })
}

function sumLines(lines: InTransitGoodsLine[], field: 'shippedQuantity' | 'receivedQuantity' | 'remainingQuantity') {
  return lines.reduce((total, line) => total + (line[field] ?? 0), 0)
}
