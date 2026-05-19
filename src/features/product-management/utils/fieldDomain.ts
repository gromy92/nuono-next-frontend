import type { ProductFieldDomainSurface, ProductWorkbenchFieldSurface, ProductWorkbenchState } from '../types';
import {
  areSnapshotPartsEqual,
  formatSnapshotValue,
  normalizeStringList,
  siteOfferCode,
  siteOfferEditableFieldsEqual,
  textInputValue
} from './common';
import {
  collectGroupingDomainIssues,
  collectRequiredAttributeIssues,
  collectSiteOfferValidationIssues
} from './fieldDomainIssues';
import {
  collectUnsupportedContentWriteIssues,
  collectUnsupportedAttributeWriteIssues,
  collectUnsupportedCurrentSiteWriteIssues,
  collectUnsupportedGroupingWriteIssues
} from './writeCoverage';

export function buildProductFieldDomainSurface(
  workbench: ProductWorkbenchState | null,
  currentSiteCode?: string
): ProductWorkbenchFieldSurface | null {
  if (!workbench) {
    return null;
  }

  const baseline = workbench.baseline;
  const draft = workbench.draft;
  const baselineSiteOffers = Array.isArray(baseline.siteOffers) ? baseline.siteOffers : [];
  const draftSiteOffers = Array.isArray(draft.siteOffers) ? draft.siteOffers : [];
  const currentSiteOffer =
    draftSiteOffers.find((item) => siteOfferCode(item) === currentSiteCode) ??
    draftSiteOffers.find((item) => Boolean(item.reference)) ??
    draftSiteOffers[0];
  const baselineCurrentSiteOffer = baselineSiteOffers.find(
    (item) => siteOfferCode(item) === siteOfferCode(currentSiteOffer ?? {})
  );

  const mainDraft = {
    brand: draft.identity.brand,
    family: draft.taxonomy.family,
    productType: draft.taxonomy.productType,
    productSubtype: draft.taxonomy.productSubtype,
    productFulltype: draft.taxonomy.productFulltype
  };
  const mainBaseline = {
    brand: baseline.identity.brand,
    family: baseline.taxonomy.family,
    productType: baseline.taxonomy.productType,
    productSubtype: baseline.taxonomy.productSubtype,
    productFulltype: baseline.taxonomy.productFulltype
  };
  const mainDirty = !areSnapshotPartsEqual(mainDraft, mainBaseline);
  const mainIssues: string[] = [];
  if (!textInputValue(draft.identity.brand).trim()) {
    mainIssues.push('商品主档缺少品牌。');
  }
  if (!textInputValue(draft.taxonomy.productFulltype).trim()) {
    mainIssues.push('商品主档缺少 Fulltype。');
  }

  const contentDraft = {
    titleEn: draft.content.titleEn,
    titleAr: draft.content.titleAr,
    descriptionEn: draft.content.descriptionEn,
    descriptionAr: draft.content.descriptionAr,
    highlightsEn: normalizeStringList(draft.content.highlightsEn),
    highlightsAr: normalizeStringList(draft.content.highlightsAr),
    images: normalizeStringList(draft.content.images)
  };
  const contentBaseline = {
    titleEn: baseline.content.titleEn,
    titleAr: baseline.content.titleAr,
    descriptionEn: baseline.content.descriptionEn,
    descriptionAr: baseline.content.descriptionAr,
    highlightsEn: normalizeStringList(baseline.content.highlightsEn),
    highlightsAr: normalizeStringList(baseline.content.highlightsAr),
    images: normalizeStringList(baseline.content.images)
  };
  const contentDirty = !areSnapshotPartsEqual(contentDraft, contentBaseline);
  const contentIssues: string[] = [];
  if (!textInputValue(draft.content.titleEn).trim()) {
    contentIssues.push('商品图文缺少标题 EN。');
  }
  if (!normalizeStringList(draft.content.images).length) {
    contentIssues.push('商品图文至少需要保留 1 张图片。');
  }
  const contentWriteIssues = collectUnsupportedContentWriteIssues(draft, baseline);

  const groupingDraft = {
    group: draft.group,
    variants: draft.variants
  };
  const groupingBaseline = {
    group: baseline.group,
    variants: baseline.variants
  };
  const groupingDirty = !areSnapshotPartsEqual(groupingDraft, groupingBaseline);
  const groupingIssues = collectGroupingDomainIssues(draft.group, Array.isArray(draft.variants) ? draft.variants : []);
  const groupingWriteIssues = collectUnsupportedGroupingWriteIssues(draft, baseline);

  const attributeDirty = !areSnapshotPartsEqual(draft.keyAttributes, baseline.keyAttributes);
  const attributeIssues = collectRequiredAttributeIssues(Array.isArray(draft.keyAttributes) ? draft.keyAttributes : []);
  const attributeWriteIssues = collectUnsupportedAttributeWriteIssues(draft, baseline);

  const dirtySiteOfferCodes = draftSiteOffers
    .filter((item) => !siteOfferEditableFieldsEqual(item, baselineSiteOffers.find((candidate) => siteOfferCode(candidate) === siteOfferCode(item))))
    .map((item) => siteOfferCode(item))
    .filter((item) => item);
  const siteDirty = currentSiteOffer ? dirtySiteOfferCodes.includes(siteOfferCode(currentSiteOffer)) : false;
  const siteIssues = collectSiteOfferValidationIssues(
    currentSiteOffer,
    `${formatSnapshotValue(currentSiteOffer?.site)} / ${siteOfferCode(currentSiteOffer ?? {})}`
  );
  const siteWriteIssues = collectUnsupportedCurrentSiteWriteIssues(
    draft,
    baseline,
    currentSiteOffer ? siteOfferCode(currentSiteOffer) : currentSiteCode
  );

  const domains: ProductFieldDomainSurface[] = [
    {
      key: 'main',
      label: '商品主档',
      scopeLabel: '共享主档',
      status: mainIssues.length ? 'blocked' : mainDirty ? 'draft' : 'synced',
      dirty: mainDirty,
      note: mainDirty ? '品牌和类目字段会通过 Noon ZSKU upsert 写回。' : '当前主档基础信息已跟随 Noon 基线。',
      metrics: [
        { label: '品牌', value: textInputValue(draft.identity.brand) || '-' },
        { label: 'Fulltype', value: textInputValue(draft.taxonomy.productFulltype) || '-' },
        { label: 'Family', value: textInputValue(draft.taxonomy.family) || '-' }
      ],
      issues: mainIssues,
      blockingIssueCount: mainIssues.length
    },
    {
      key: 'content',
      label: '图文内容',
      scopeLabel: '共享主档',
      status: contentWriteIssues.length || contentIssues.length ? 'blocked' : contentDirty ? 'draft' : 'synced',
      dirty: contentDirty,
      note: contentDirty
        ? '标题、详情、卖点和图片会通过 Noon ZSKU upsert 写回，发布后进入历史观察。'
        : '当前图文内容与最近同步基线一致。',
      metrics: [
        { label: '图片', value: normalizeStringList(draft.content.images).length },
        {
          label: '双语标题',
          value: textInputValue(draft.content.titleEn).trim() && textInputValue(draft.content.titleAr).trim() ? '已齐' : '待补'
        },
        { label: 'EN 卖点', value: normalizeStringList(draft.content.highlightsEn).length },
        { label: 'AR 卖点', value: normalizeStringList(draft.content.highlightsAr).length }
      ],
      issues: [...contentWriteIssues, ...contentIssues],
      blockingIssueCount: contentWriteIssues.length + contentIssues.length
    },
    {
      key: 'grouping',
      label: 'Group 与变体',
      scopeLabel: '共享主档',
      status: groupingWriteIssues.length ? 'blocked' : groupingDirty ? 'draft' : groupingIssues.length ? 'attention' : 'synced',
      dirty: groupingDirty,
      note: groupingDirty
        ? '已有成员的 Group 轴属性值、新增未分组商品和 Unlink 会写回 Noon；换组和轴定义仍会阻断。'
        : '当前 Group 与变体结构已跟随最近基线。',
      metrics: [
        {
          label: 'Group 轴',
          value: Array.isArray(draft.group.axes) ? draft.group.axes.length : 0
        },
        { label: '变体', value: Array.isArray(draft.variants) ? draft.variants.length : 0 },
        { label: '候选组', value: Number(draft.group.candidateGroupCount ?? 0) || 0 }
      ],
      issues: [...groupingWriteIssues, ...groupingIssues],
      blockingIssueCount: groupingWriteIssues.length
    },
    {
      key: 'attributes',
      label: '关键属性',
      scopeLabel: '共享主档',
      status: attributeWriteIssues.length ? 'blocked' : attributeIssues.length ? 'attention' : attributeDirty ? 'draft' : 'synced',
      dirty: attributeDirty,
      note: attributeDirty
        ? '普通标量关键属性会通过 Noon ZSKU upsert 写回；核心属性和复杂值保持只读。'
        : '关键属性当前已跟随最近基线。',
      metrics: [
        { label: '属性项', value: Array.isArray(draft.keyAttributes) ? draft.keyAttributes.length : 0 },
        { label: '必填缺口', value: attributeIssues.length },
        {
          label: '分组轴属性',
          value: Array.isArray(draft.keyAttributes)
            ? draft.keyAttributes.filter((item) => Boolean(item.grouping)).length
            : 0
        }
      ],
      issues: [...attributeWriteIssues, ...attributeIssues],
      blockingIssueCount: attributeWriteIssues.length
    },
    {
      key: 'site',
      label: '当前站点经营',
      scopeLabel: textInputValue(currentSiteOffer?.site).trim()
        ? `${textInputValue(currentSiteOffer?.site)} 站点`
        : '当前站点',
      status:
        siteIssues.length || siteWriteIssues.length
          ? 'blocked'
          : siteDirty
            ? 'draft'
            : dirtySiteOfferCodes.length
              ? 'attention'
              : 'synced',
      dirty: siteDirty || dirtySiteOfferCodes.length > 0,
      note:
        siteDirty || dirtySiteOfferCodes.length
          ? `站点价格、促销、上下限、售卖状态、保修和备注有本地草稿；库存和 Live 状态只读。`
          : '当前站点经营信息已跟随最近同步基线。',
      metrics: [
        { label: '当前售价', value: textInputValue(currentSiteOffer?.price) || '-' },
        { label: '站点草稿', value: dirtySiteOfferCodes.length },
        {
          label: '运营状态',
          value: Boolean(currentSiteOffer?.isActive) ? '启用' : '停用'
        }
      ],
      issues: [...siteWriteIssues, ...siteIssues],
      blockingIssueCount: siteWriteIssues.length + siteIssues.length
    }
  ];

  const changedDomainKeys = domains.filter((item) => item.dirty).map((item) => item.key);
  const changedDomainLabels = domains.filter((item) => item.dirty).map((item) => item.label);
  const publishCurrentDomainKeys = domains
    .filter((item) => item.key !== 'site' && item.dirty)
    .map((item) => item.key);
  if (siteDirty) {
    publishCurrentDomainKeys.push('site');
  }

  return {
    domains,
    changedDomainKeys,
    changedDomainLabels,
    publishCurrentScopeLabel: publishCurrentDomainKeys.length
      ? publishCurrentDomainKeys
          .map((key) => domains.find((item) => item.key === key)?.label)
          .filter((item): item is string => Boolean(item))
          .join(' / ')
      : '当前没有新的字段域变更',
    publishCurrentIssues: [
      ...mainIssues,
      ...contentWriteIssues,
      ...contentIssues,
      ...groupingWriteIssues,
      ...attributeWriteIssues,
      ...siteWriteIssues,
      ...siteIssues
    ],
    currentSiteCode: currentSiteOffer ? siteOfferCode(currentSiteOffer) : undefined
  };
}
