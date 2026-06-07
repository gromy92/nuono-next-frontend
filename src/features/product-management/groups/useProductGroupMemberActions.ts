import { message } from 'antd';
import { useState } from 'react';
import type { ProductListRowPayload } from '../types';
import { textInputValue } from '../utils';
import {
  memberDraftFromView,
  memberRecordFromDraft,
  memberRecordKey
} from './ProductGroupOfficialPanel.helpers';
import type { ProductGroupMemberDraft } from './ProductGroupMemberEditModal';
import type { ProductGroupMemberListItem } from './ProductGroupMemberList';
import type { ProductGroupMemberCardView } from './productGroupMemberTypes';

type UpdateProductSectionField = (
  section: 'identity' | 'taxonomy' | 'content' | 'group',
  field: string,
  value: unknown
) => void;

type UseProductGroupMemberActionsParams = {
  rawMembers: Array<Record<string, unknown>>;
  memberRows: ProductGroupMemberListItem[];
  memberSkuSet: Set<string>;
  group: Record<string, unknown>;
  axisCode?: string;
  currentSkuParent?: string;
  updateProductSectionField: UpdateProductSectionField;
  onCurrentMemberUnlinkRequested?: (
    target: ProductGroupMemberCardView,
    alternate: ProductGroupMemberCardView
  ) => void;
};

export function useProductGroupMemberActions(params: UseProductGroupMemberActionsParams) {
  const {
    rawMembers,
    memberRows,
    memberSkuSet,
    group,
    axisCode,
    currentSkuParent,
    updateProductSectionField,
    onCurrentMemberUnlinkRequested
  } = params;
  const [memberEditOpen, setMemberEditOpen] = useState(false);
  const [memberModalKey, setMemberModalKey] = useState('');
  const [memberModalDraft, setMemberModalDraft] = useState<ProductGroupMemberDraft>({ skuParent: '' });
  const [unlinkMember, setUnlinkMember] = useState<ProductGroupMemberCardView | null>(null);
  const [addProductsOpen, setAddProductsOpen] = useState(false);

  const updateGroupField = (field: string, value: unknown) => updateProductSectionField('group', field, value);

  const openEditMember = (member: ProductGroupMemberListItem) => {
    setMemberEditOpen(true);
    setMemberModalKey(member.key);
    setMemberModalDraft({
      ...memberDraftFromView(member),
      imageUrl: member.imageUrl,
      partnerSku: member.partnerSku,
      totalFbnStock: member.totalFbnStock,
      totalFbpStock: member.totalFbpStock
    });
  };

  const submitMemberDraft = (draft: ProductGroupMemberDraft) => {
    const duplicate = rawMembers.some((item) => memberRecordKey(item) === draft.skuParent && memberRecordKey(item) !== memberModalKey);
    if (duplicate) {
      message.warning('该 SKU 已在当前分组中');
      return;
    }
    const fallback = rawMembers.find((item) => memberRecordKey(item) === memberModalKey) ?? {};
    const nextRecord = memberRecordFromDraft(draft, axisCode, group, fallback);
    const nextMembers = rawMembers.map((item) => (memberRecordKey(item) === memberModalKey ? nextRecord : item));
    updateGroupField('members', nextMembers);
    updateGroupField('memberCount', nextMembers.length);
    setMemberEditOpen(false);
    message.success('已记录 Group 修改，请点击发布修改。');
  };

  const submitAddProducts = (products: ProductListRowPayload[]) => {
    const nextRecords = products
      .filter((product) => {
        const skuParent = textInputValue(product.skuParent).trim();
        return skuParent && !memberSkuSet.has(skuParent);
      })
      .map((product) => {
        const draft: ProductGroupMemberDraft = {
          skuParent: textInputValue(product.skuParent),
          childSku: textInputValue(product.offerCode || product.pskuCode || product.partnerSku),
          brand: textInputValue(product.brand),
          title: textInputValue(product.title),
          axisValue: ''
        };
        return {
          ...memberRecordFromDraft(draft, axisCode, group),
          partnerSku: product.partnerSku,
          pskuCode: product.pskuCode,
          imageUrl: product.imageUrl || product.galleryImages?.[0],
          galleryImages: [product.imageUrl, ...(product.galleryImages ?? [])].filter(Boolean),
          productFulltype: product.productFulltype
        };
      });
    if (!nextRecords.length) {
      message.warning('所选商品已在当前分组中');
      return;
    }
    const nextMembers = [...rawMembers, ...nextRecords];
    updateGroupField('members', nextMembers);
    updateGroupField('memberCount', nextMembers.length);
    setAddProductsOpen(false);
    message.success('已加入当前 Group 待发布修改，请点击发布修改。');
  };

  const openUnlinkMember = (member: ProductGroupMemberCardView) => {
    setUnlinkMember(member);
  };

  const confirmUnlinkMember = () => {
    if (!unlinkMember) {
      return;
    }
    const targetKey = unlinkMember.key || unlinkMember.skuParent;
    if (unlinkMember.skuParent && unlinkMember.skuParent === currentSkuParent) {
      const alternateMember = memberRows.find((item) => item.skuParent && item.skuParent !== currentSkuParent);
      if (!alternateMember) {
        message.warning('当前 Group 至少需要保留一个商品，暂时不能移除最后一个成员。');
        return;
      }
      if (!onCurrentMemberUnlinkRequested) {
        message.warning('当前详情商品暂不支持在本页直接移除，请从同 Group 的其它商品详情移除它。');
        return;
      }
      setUnlinkMember(null);
      onCurrentMemberUnlinkRequested(unlinkMember, alternateMember);
      return;
    }
    const nextMembers = rawMembers.filter((item) => memberRecordKey(item) !== targetKey);
    updateGroupField('members', nextMembers);
    updateGroupField('memberCount', nextMembers.length);
    setUnlinkMember(null);
    message.success('已记录移除关联修改，请点击发布修改。');
  };

  return {
    memberEditOpen,
    memberModalDraft,
    unlinkMember,
    addProductsOpen,
    openEditMember,
    submitMemberDraft,
    submitAddProducts,
    openUnlinkMember,
    confirmUnlinkMember,
    openAddProducts: () => setAddProductsOpen(true),
    closeAddProducts: () => setAddProductsOpen(false),
    closeMemberEdit: () => setMemberEditOpen(false),
    closeUnlinkMember: () => setUnlinkMember(null)
  };
}
