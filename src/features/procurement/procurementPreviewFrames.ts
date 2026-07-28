import type { ProcurementCandidatePoolPayload, ProcurementPreviewFrame, ProcurementSearchPagePreviewPayload } from './types';
import {
  formatProcurementPriceRange,
  procurementCandidateDisplayTitle,
  procurementDemandDisplayTitle,
  procurementDisplayArray,
  procurementDisplayText,
  procurementPlatformLabel,
  procurementRequirementText,
  sanitizeProcurementCopy
} from './domain';
import { buildProcurementIllustrationDataUrl, procurementProductFamily } from './procurementPreviewIllustration';

export function buildProcurementSourcePreviewFrames(
  item: ProcurementCandidatePoolPayload['demandItems'][number]
): ProcurementPreviewFrame[] {
  const title = procurementDemandDisplayTitle(item);
  const family = procurementProductFamily(title);
  const requirement = procurementRequirementText(item.specialRequirement);
  return [
    {
      key: 'main',
      label: '主图',
      title,
      subtitle: `${procurementPlatformLabel(item.sourcePlatform)} · 目标站点 ${item.targetSite || '待确认'}`,
      imageUrl:
        item.sourceImageUrl ||
        buildProcurementIllustrationDataUrl({
          title,
          subtitle: `${procurementPlatformLabel(item.sourcePlatform)} · 目标站点 ${item.targetSite || '待确认'}`,
          badge: '原商品主图',
          chips: [
            `目标价 ${formatProcurementPriceRange(item.targetPriceMin, item.targetPriceMax)}`,
            `目标量 ${item.targetQuantity || '-'} 件`,
            requirement
          ],
          family,
          variant: 'main',
          seed: `source-main-${item.id}`
        }),
      imageMode: item.sourceImageUrl ? 'real' : 'generated',
      highlights: [
        `目标价 ${formatProcurementPriceRange(item.targetPriceMin, item.targetPriceMax)}`,
        `目标量 ${item.targetQuantity || '-'} 件`,
        requirement
      ]
    },
    {
      key: 'detail',
      label: '细节重点',
      title: '重点看炉体结构与使用细节',
      subtitle: '采购判断时优先确认外形、开孔、按键位置和材质质感是否接近原商品。',
      imageUrl: item.sourceDetailImageUrl || buildProcurementIllustrationDataUrl({
        title,
        subtitle: '重点看外观结构、开孔位置与材质质感',
        badge: '原商品细节',
        chips: [title, requirement, item.targetSite ? `目标站点 ${item.targetSite}` : '目标站点待确认'],
        family,
        variant: 'detail',
        seed: `source-detail-${item.id}`
      }),
      imageMode: item.sourceDetailImageUrl ? 'real' : 'generated',
      highlights: [
        title,
        requirement,
        item.targetSite ? `目标站点 ${item.targetSite}` : '目标站点待确认'
      ],
      note: '后续补真实图片后，这里优先承接细节图和局部结构图。'
    },
    {
      key: 'pack',
      label: '包装重点',
      title: '重点看礼品感与交付稳定性',
      subtitle: '适合中东销售的熏香类商品，包装完整度和礼盒感通常会直接影响采购决策。',
      imageUrl: item.sourcePackageImageUrl || buildProcurementIllustrationDataUrl({
        title,
        subtitle: '重点看礼盒感、包装完整度和交付稳定性',
        badge: '原商品包装',
        chips: [`目标量 ${item.targetQuantity || '-'} 件`, requirement, '建议确认包装清单与运输稳定性'],
        family,
        variant: 'pack',
        seed: `source-pack-${item.id}`
      }),
      imageMode: item.sourcePackageImageUrl ? 'real' : 'generated',
      highlights: [
        `目标量 ${item.targetQuantity || '-'} 件`,
        requirement,
        '建议确认包装清单与运输稳定性'
      ],
      note: '当前样本图未挂包装图时，先用采购要求卡片做判断占位。'
    }
  ];
}

export function buildProcurementCandidatePreviewFrames(
  candidate: ProcurementCandidatePoolPayload['demandItems'][number]['candidates'][number]
): ProcurementPreviewFrame[] {
  const reasons = procurementDisplayArray(candidate.reasons);
  const warnings = procurementDisplayArray(candidate.warnings);
  const badges = procurementDisplayArray(candidate.badges);
  const title = procurementCandidateDisplayTitle(candidate);
  const family = procurementProductFamily(title);

  return [
    {
      key: 'main',
      label: '候选主图',
      title,
      subtitle: `${procurementDisplayText(candidate.supplierName)} · ${procurementDisplayText(candidate.locationText)}`,
      imageUrl: candidate.mainImageUrl || buildProcurementIllustrationDataUrl({
        title,
        subtitle: `${procurementDisplayText(candidate.supplierName)} · ${procurementDisplayText(candidate.locationText)}`,
        badge: '候选商品主图',
        chips: [
          candidate.standardizedPriceText ? `候选价 ${candidate.standardizedPriceText}` : '候选价格待确认',
          candidate.standardizedMoqText ? `起订量 ${candidate.standardizedMoqText}` : '起订量待确认',
          badges[0] || '供应标签待补充'
        ],
        family,
        variant: 'main',
        seed: `candidate-main-${candidate.id}`
      }),
      imageMode: candidate.mainImageUrl ? 'real' : 'generated',
      highlights: [
        candidate.standardizedPriceText ? `候选价 ${candidate.standardizedPriceText}` : '候选价格待确认',
        candidate.standardizedMoqText ? `起订量 ${candidate.standardizedMoqText}` : '起订量待确认',
        badges[0] || '供应标签待补充'
      ]
    },
    {
      key: 'detail',
      label: '细节判断',
      title: '重点看外观相似度与功能一致性',
      subtitle: '优先看候选商品是否命中关键卖点，再判断是否需要继续进详情页或询价。',
      imageUrl: candidate.detailImageUrl || buildProcurementIllustrationDataUrl({
        title,
        subtitle: '重点看是否命中关键卖点与外观结构',
        badge: '候选细节',
        chips: [
          reasons[0] || '等待补充命中理由',
          reasons[1] || '等待补充结构线索',
          warnings[0] || '当前未识别明显细节风险'
        ],
        family,
        variant: 'detail',
        seed: `candidate-detail-${candidate.id}`
      }),
      imageMode: candidate.detailImageUrl ? 'real' : 'generated',
      highlights: [
        reasons[0] || '等待补充命中理由',
        reasons[1] || '等待补充结构线索',
        warnings[0] || '当前未识别明显细节风险'
      ],
      note: warnings[1] || '如需继续推进，可在下一步增加规格核验和人工询价。'
    },
    {
      key: 'delivery',
      label: '供应履约',
      title: '重点看供应商能力与交付压力',
      subtitle: '采购同学通常会结合供应商标签、起订量和发货地，快速判断是否值得进入询价。',
      imageUrl: candidate.deliveryImageUrl || buildProcurementIllustrationDataUrl({
        title,
        subtitle: '重点看供应商能力、发货地和交付稳定性',
        badge: '候选履约',
        chips: [
          procurementDisplayText(candidate.supplierName),
          badges[0] || '供应能力标签待补充',
          candidate.standardizedMoqText ? `起订量 ${candidate.standardizedMoqText}` : '起订量待确认'
        ],
        family,
        variant: 'pack',
        seed: `candidate-delivery-${candidate.id}`
      }),
      imageMode: candidate.deliveryImageUrl ? 'real' : 'generated',
      highlights: [
        procurementDisplayText(candidate.supplierName),
        badges[0] || '供应能力标签待补充',
        candidate.standardizedMoqText ? `起订量 ${candidate.standardizedMoqText}` : '起订量待确认'
      ],
      note: warnings[0] || '当前风险可控，可继续保留在候选池中。'
    }
  ];
}

export function buildProcurementSearchPreviewFrame(
  candidate: ProcurementSearchPagePreviewPayload['candidates'][number]
): ProcurementPreviewFrame {
  const title = procurementDisplayText(candidate.title);
  const family = procurementProductFamily(title);
  const supplierName = procurementDisplayText(candidate.supplierName);
  const locationText = procurementDisplayText(candidate.locationText);

  return {
    key: 'search-preview',
    label: '搜索候选图',
    title,
    subtitle: `${supplierName} · ${locationText}`,
    imageUrl: candidate.mainImageUrl || buildProcurementIllustrationDataUrl({
      title,
      subtitle: `${supplierName} · ${locationText}`,
      badge: '搜索结果示意',
      chips: [
        candidate.priceText ? `候选价 ${sanitizeProcurementCopy(candidate.priceText)}` : '候选价格待确认',
        candidate.moqText ? `起订量 ${sanitizeProcurementCopy(candidate.moqText)}` : '起订量待确认',
        candidate.materialText ? sanitizeProcurementCopy(candidate.materialText) : '材质待确认'
      ],
      family,
      variant: 'main',
      seed: `search-preview-${candidate.candidateUrl || title}`
    }),
    imageMode: candidate.mainImageUrl ? 'real' : 'generated',
    highlights: [
      candidate.priceText ? `候选价 ${sanitizeProcurementCopy(candidate.priceText)}` : '候选价格待确认',
      candidate.moqText ? `起订量 ${sanitizeProcurementCopy(candidate.moqText)}` : '起订量待确认',
      candidate.materialText ? sanitizeProcurementCopy(candidate.materialText) : '材质待确认'
    ]
  };
}
