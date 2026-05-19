import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { memberRecordKey } from './ProductGroupOfficialPanel.helpers';
import type { ProductGroupMemberCardView } from './productGroupMemberTypes';
import { textInputValue } from '../utils';
import type { ProductManagementWorkspace } from '../workspaceTypes';

type PendingCurrentMemberUnlink = {
  targetSkuParent: string;
  alternateSkuParent: string;
};

type UseProductGroupCurrentMemberUnlinkParams = {
  workspace: ProductManagementWorkspace;
};

export function useProductGroupCurrentMemberUnlink({
  workspace
}: UseProductGroupCurrentMemberUnlinkParams) {
  const unlinkMessageKey = 'product-group-current-member-unlink';
  const [pendingCurrentMemberUnlink, setPendingCurrentMemberUnlink] =
    useState<PendingCurrentMemberUnlink | null>(null);
  const productBySkuParent = useMemo(() => {
    const bySkuParent = new Map(
      workspace.productListSourceItems.map((item) => [item.skuParent, item] as const)
    );
    return bySkuParent;
  }, [workspace.productListSourceItems]);

  const requestCurrentMemberUnlink = useCallback(
    async (target: ProductGroupMemberCardView, alternate: ProductGroupMemberCardView) => {
      const targetSkuParent = textInputValue(target.skuParent || target.key);
      const alternateSkuParent = textInputValue(alternate.skuParent || alternate.key);
      if (!targetSkuParent || !alternateSkuParent) {
        message.warning('当前 Group 成员缺少 SKU，暂时不能移除关联。');
        return;
      }
      const alternateProduct = productBySkuParent.get(alternateSkuParent);
      setPendingCurrentMemberUnlink({ targetSkuParent, alternateSkuParent });
      message.loading({
        key: unlinkMessageKey,
        content: '正在切换工作商品并记录移除关联...',
        duration: 0
      });
      const opened = await workspace.openProductWorkbenchInCurrentPage({
        skuParent: alternateSkuParent,
        partnerSku: alternateProduct?.partnerSku,
        pskuCode: alternateProduct?.pskuCode,
        storeCode: alternateProduct?.referenceStoreCode
      });
      if (!opened) {
        setPendingCurrentMemberUnlink(null);
        message.error({
          key: unlinkMessageKey,
          content: '切换工作商品失败，暂时不能移除当前商品关联。'
        });
      }
    },
    [productBySkuParent, workspace]
  );

  useEffect(() => {
    if (!pendingCurrentMemberUnlink) {
      return;
    }
    if (
      workspace.productWorkbenchSurfaceState.status === 'error' &&
      workspace.productWorkbenchSurfaceState.context?.skuParent === pendingCurrentMemberUnlink.alternateSkuParent
    ) {
      setPendingCurrentMemberUnlink(null);
      message.error({
        key: unlinkMessageKey,
        content: '切换工作商品失败，暂时不能移除当前商品关联。'
      });
      return;
    }
    const snapshot = workspace.productSnapshotView;
    const currentSkuParent = textInputValue(snapshot?.identity.skuParent);
    if (!snapshot || currentSkuParent !== pendingCurrentMemberUnlink.alternateSkuParent) {
      return;
    }
    const members = Array.isArray(snapshot.group.members)
      ? (snapshot.group.members as Array<Record<string, unknown>>)
      : [];
    const nextMembers = members.filter(
      (member) => memberRecordKey(member) !== pendingCurrentMemberUnlink.targetSkuParent
    );
    if (nextMembers.length === members.length) {
      setPendingCurrentMemberUnlink(null);
      message.info({
        key: unlinkMessageKey,
        content: '目标商品已不在当前 Group 中。'
      });
      return;
    }

    workspace.updateProductSectionField('group', 'members', nextMembers);
    workspace.updateProductSectionField('group', 'memberCount', nextMembers.length);
    setPendingCurrentMemberUnlink(null);
    message.success({
      key: unlinkMessageKey,
      content: '已切换工作商品并记录移除关联修改，请点击发布修改。'
    });
  }, [pendingCurrentMemberUnlink, workspace]);

  return {
    requestCurrentMemberUnlink
  };
}
