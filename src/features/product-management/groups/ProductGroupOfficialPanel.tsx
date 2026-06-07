import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Space, Tag, Tooltip, Typography } from 'antd';
import { useMemo } from 'react';
import type { ProductListRowPayload, ProductWorkbenchPayload } from '../types';
import { formatSnapshotValue, textInputValue } from '../utils';
import {
  groupAxes,
  attributeValue,
  memberRecordKey,
  recordAxisValue,
  memberView
} from './ProductGroupOfficialPanel.helpers';
import { ProductGroupAddProductsDrawer } from './ProductGroupAddProductsDrawer';
import { ProductGroupMemberEditModal } from './ProductGroupMemberEditModal';
import { ProductGroupUnlinkConfirmModal } from './ProductGroupUnlinkConfirmModal';
import { ProductGroupMemberList, type ProductGroupMemberListItem } from './ProductGroupMemberList';
import { useProductGroupMemberActions } from './useProductGroupMemberActions';
import type { ProductGroupMemberCardView } from './productGroupMemberTypes';

const { Text } = Typography;

const MAX_VISIBLE_GROUP_MEMBERS = 6;

type UpdateProductSectionField = (
  section: 'identity' | 'taxonomy' | 'content' | 'group',
  field: string,
  value: unknown
) => void;

export function ProductGroupOfficialPanel(props: {
  productSnapshotView?: ProductWorkbenchPayload;
  productGroupMembers: Array<Record<string, unknown>>;
  productListSourceItems: ProductListRowPayload[];
  updateProductSectionField: UpdateProductSectionField;
  memberDisplayLimit?: number | null;
  compact?: boolean;
  actionDisabled?: boolean;
  onCurrentMemberUnlinkRequested?: (
    target: ProductGroupMemberCardView,
    alternate: ProductGroupMemberCardView
  ) => void;
  onMemberDetailOpen?: (member: ProductGroupMemberListItem) => void;
}) {
  const {
    productSnapshotView,
    productGroupMembers,
    productListSourceItems,
    updateProductSectionField,
    memberDisplayLimit = MAX_VISIBLE_GROUP_MEMBERS,
    compact = false,
    actionDisabled = false,
    onCurrentMemberUnlinkRequested,
    onMemberDetailOpen
  } = props;
  const group = productSnapshotView?.group ?? {};
  const hasGroup = Boolean(textInputValue(group.skuGroup || group.groupRefCanonical || group.groupRef).trim());
  const axes = groupAxes(group);
  const primaryAxis = axes[0];
  const axisLabel = textInputValue(primaryAxis?.axisName || primaryAxis?.axisCode);
  const axisCode = textInputValue(primaryAxis?.axisCode);
  const axisRows = axes
    .map((axis) => ({
      label: textInputValue(axis.axisName || axis.axisCode),
      code: textInputValue(axis.axisCode)
    }))
    .filter((axis) => axis.label && axis.code);
  const productBySkuParent = useMemo(() => {
    const bySkuParent = new Map<string, ProductListRowPayload>();
    productListSourceItems.forEach((item) => {
      if (item.skuParent) {
        bySkuParent.set(item.skuParent, item);
      }
    });
    return bySkuParent;
  }, [productListSourceItems]);

  const rawMembers = productSnapshotView
    ? productGroupMembers.length ? productGroupMembers : [{ skuParent: productSnapshotView.identity.skuParent }]
    : [];
  const memberSkuSet = new Set(rawMembers.map(memberRecordKey).filter(Boolean));
  const addableProducts = productListSourceItems.filter((item) => {
    const skuParent = textInputValue(item.skuParent).trim();
    if (!skuParent || memberSkuSet.has(skuParent)) {
      return false;
    }
    return !textInputValue(item.skuGroup || item.groupRefCanonical || item.groupRef).trim();
  });
  const currentSkuParent = productSnapshotView ? textInputValue(productSnapshotView.identity.skuParent) : '';
  const visibleMembers =
    memberDisplayLimit === null ? [...rawMembers] : rawMembers.slice(0, Math.max(memberDisplayLimit, 0));
  if (memberDisplayLimit !== null && currentSkuParent && !visibleMembers.some((item) => memberRecordKey(item) === currentSkuParent)) {
    const currentMember = rawMembers.find((item) => memberRecordKey(item) === currentSkuParent);
    if (currentMember) {
      visibleMembers.splice(Math.max(0, Math.max(memberDisplayLimit, 0) - 1), 1, currentMember);
    }
  }
  const enrichedVisibleMembers = visibleMembers.map((item) => {
    const skuParent = memberRecordKey(item);
    const fallback = productBySkuParent.get(skuParent);
    if (!fallback) {
      return item;
    }
    return {
      ...item,
      brand: textInputValue(item.brand) || fallback.brand,
      title: textInputValue(item.title || item.titleEn || item.productTitle) || fallback.title,
      imageUrl:
        textInputValue(item.imageUrl || item.mainImageUrl || item.imageKey || item.image_key) ||
        fallback.imageUrl ||
        fallback.galleryImages?.[0],
      galleryImages: Array.isArray(item.galleryImages) && item.galleryImages.length
        ? item.galleryImages
        : [fallback.imageUrl, ...(fallback.galleryImages ?? [])].filter(Boolean),
      partnerSku: textInputValue(item.partnerSku) || fallback.partnerSku,
      pskuCode: textInputValue(item.pskuCode) || fallback.pskuCode,
      offerCode: textInputValue(item.offerCode) || fallback.offerCode,
      liveStatus: textInputValue(item.liveStatus) || fallback.liveStatus,
      statusCode: textInputValue(item.statusCode) || fallback.statusCode,
      isActive: typeof item.isActive === 'boolean' ? item.isActive : fallback.isActive,
      liveStatuses: Array.isArray(item.liveStatuses) ? item.liveStatuses : fallback.liveStatuses,
      siteLabels: Array.isArray(item.siteLabels) ? item.siteLabels : fallback.siteLabels,
      totalFbnStock: item.totalFbnStock ?? fallback.totalFbnStock,
      totalSupermallStock: item.totalSupermallStock ?? fallback.totalSupermallStock,
      totalFbpStock: item.totalFbpStock ?? fallback.totalFbpStock
    };
  });
  const memberRows: ProductGroupMemberListItem[] = productSnapshotView ? enrichedVisibleMembers.map((item) => {
    const card = memberView(item, productSnapshotView, axisLabel, axisCode);
    return {
      ...card,
      partnerSku: textInputValue(item.partnerSku),
      pskuCode: textInputValue(item.pskuCode),
      offerCode: textInputValue(item.offerCode),
      liveStatus: textInputValue(item.liveStatus),
      statusCode: textInputValue(item.statusCode),
      isActive: typeof item.isActive === 'boolean' ? item.isActive : undefined,
      liveStatuses: Array.isArray(item.liveStatuses) ? item.liveStatuses.map(textInputValue).filter(Boolean) : undefined,
      siteLabels: Array.isArray(item.siteLabels) ? item.siteLabels.map(textInputValue).filter(Boolean) : undefined,
      totalFbnStock: Number(item.totalFbnStock ?? 0),
      totalSupermallStock: Number(item.totalSupermallStock ?? 0),
      totalFbpStock: Number(item.totalFbpStock ?? 0),
      axisRows: axisRows.map((axis) => ({
        code: axis.code,
        label: axis.label,
        value:
          recordAxisValue(item, axis.code) ||
          (card.current ? attributeValue(productSnapshotView, axis.code) : undefined)
      }))
    };
  }) : [];
  const memberCount = rawMembers.length;
  const memberActions = useProductGroupMemberActions({
    rawMembers,
    memberRows,
    memberSkuSet,
    group,
    axisCode,
    currentSkuParent,
    updateProductSectionField,
    onCurrentMemberUnlinkRequested
  });

  if (!productSnapshotView || !hasGroup) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="This product is not linked to any group" />;
  }

  return (
    <>
      <div style={{ border: '1px solid var(--pm-subtle-border)', borderRadius: 8, background: '#fff', overflow: 'hidden' }}>
        {compact ? null : (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--pm-subtle-border)' }}>
            <Space size={10} wrap>
              <Text strong style={{ fontSize: 18 }}>{formatSnapshotValue(group.groupRef || group.skuGroup)}</Text>
              <Text style={{ color: 'var(--pm-text-muted)', fontSize: 13 }}>| {formatSnapshotValue(group.skuGroup)}</Text>
              <Tag style={{ borderRadius: 14, padding: '2px 8px', fontSize: 12 }}>
                {memberCount} {memberCount === 1 ? 'product' : 'products'}
              </Tag>
            </Space>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: compact ? '8px 12px' : '12px 16px',
            borderBottom: '1px solid var(--pm-subtle-border)',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Space size={14} wrap>
            <Text style={{ fontSize: 13 }}>Axes</Text>
            {axes.map((axis) => (
              <Tag key={textInputValue(axis.axisCode || axis.axisName)} style={{ borderRadius: 14, padding: '2px 8px', fontSize: 12 }}>
                {formatSnapshotValue(axis.axisName || axis.axisCode)}
              </Tag>
            ))}
          </Space>
          <Tooltip title={addableProducts.length ? '选择未分组商品加入当前 Group' : '当前没有可加入的未分组商品'}>
            <span>
              <Button
                size="small"
                icon={<PlusOutlined />}
                disabled={actionDisabled || !addableProducts.length}
                onClick={memberActions.openAddProducts}
              >
                添加未分组商品
              </Button>
            </span>
          </Tooltip>
        </div>

        <div style={{ padding: compact ? 10 : 12 }}>
          <ProductGroupMemberList
            members={memberRows}
            onEdit={memberActions.openEditMember}
            onOpenDetail={onMemberDetailOpen}
            onUnlink={memberActions.openUnlinkMember}
            actionDisabled={actionDisabled}
            compact={compact}
          />
        </div>
      </div>

      <ProductGroupMemberEditModal
        open={memberActions.memberEditOpen}
        axisLabel={axisLabel}
        initialValue={memberActions.memberModalDraft}
        onCancel={memberActions.closeMemberEdit}
        onSubmit={memberActions.submitMemberDraft}
        submitDisabled={actionDisabled}
      />
      <ProductGroupUnlinkConfirmModal
        open={Boolean(memberActions.unlinkMember)}
        groupName={textInputValue(group.groupRef || group.skuGroup)}
        member={memberActions.unlinkMember}
        onCancel={memberActions.closeUnlinkMember}
        onConfirm={memberActions.confirmUnlinkMember}
        confirmDisabled={actionDisabled}
      />
      <ProductGroupAddProductsDrawer
        open={memberActions.addProductsOpen}
        candidates={addableProducts}
        memberSkuSet={memberSkuSet}
        onClose={memberActions.closeAddProducts}
        onSubmit={memberActions.submitAddProducts}
        submitDisabled={actionDisabled}
      />
    </>
  );
}
