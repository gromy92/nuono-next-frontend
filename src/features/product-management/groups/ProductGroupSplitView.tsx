import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Input, Segmented, Space, Typography } from 'antd';
import type { ProductListRowPayload } from '../types';
import type { ProductManagementWorkspace } from '../workspaceTypes';
import { ProductGroupDetailPanel } from './ProductGroupDetailPanel';
import { ProductGroupListPane } from './ProductGroupListPane';
import type { ProductGroupMemberListItem } from './ProductGroupMemberList';
import { ProductUngroupedPanel } from './ProductUngroupedPanel';
import type { ProductGroupRow } from './productGroupRows';

const { Text } = Typography;

type GroupStatusFilter = 'all' | 'draft' | 'issue';

type ProductGroupSplitViewProps = {
  groups: ProductGroupRow[];
  filteredGroups: ProductGroupRow[];
  filteredUngroupedProducts: ProductListRowPayload[];
  selectedGroup: ProductGroupRow | null;
  ungroupedProductCount: number;
  groupKeyword: string;
  productKeyword: string;
  statusFilter: GroupStatusFilter;
  showUngroupedOnly: boolean;
  loading: boolean;
  errorMessage?: string;
  activeOwnerId?: number;
  workspace: ProductManagementWorkspace;
  onGroupKeywordChange: (value: string) => void;
  onProductKeywordChange: (value: string) => void;
  onStatusFilterChange: (value: GroupStatusFilter) => void;
  onShowUngroupedOnlyChange: (value: boolean) => void;
  onRefresh: () => void;
  onSelectGroup: (group: ProductGroupRow) => void;
};

function groupedProductCount(groups: ProductGroupRow[]) {
  return groups.reduce((sum, group) => sum + group.memberCount, 0);
}

export function ProductGroupSplitView(props: ProductGroupSplitViewProps) {
  const {
    groups,
    filteredGroups,
    filteredUngroupedProducts,
    selectedGroup,
    ungroupedProductCount,
    groupKeyword,
    productKeyword,
    statusFilter,
    showUngroupedOnly,
    loading,
    errorMessage,
    activeOwnerId,
    workspace,
    onGroupKeywordChange,
    onProductKeywordChange,
    onStatusFilterChange,
    onShowUngroupedOnlyChange,
    onRefresh,
    onSelectGroup
  } = props;
  const summaryText = `已分组商品数：${groupedProductCount(groups)}，分组数量：${groups.length}，未分组商品数：${ungroupedProductCount}`;
  const openProductDetail = (product: ProductGroupMemberListItem) => {
    if (!product.skuParent) {
      return;
    }
    void workspace.openProductWorkbenchInPageTab({
      skuParent: product.skuParent,
      partnerSku: product.partnerSku,
      pskuCode: product.pskuCode,
      storeCode: workspace.selectedInitializationStoreCode
    });
  };

  return (
    <div
      style={{
        background: '#fff'
      }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(260px, 1fr) auto',
            gap: 12,
            alignItems: 'center',
            minHeight: 40
          }}
        >
          <Text strong style={{ fontSize: 15 }}>
            {summaryText}
          </Text>
          <Space wrap size={8} style={{ justifyContent: 'flex-end' }}>
            <Input.Search
              allowClear
              value={productKeyword}
              placeholder="搜索 SKU / 品牌 / 标题"
              style={{ width: 320 }}
              onChange={(event) => onProductKeywordChange(event.target.value)}
            />
            <Segmented
              size="small"
              value={statusFilter}
              disabled={showUngroupedOnly}
              options={[
                { label: '全部', value: 'all' },
                { label: '待发布', value: 'draft' },
                { label: '异常', value: 'issue' }
              ]}
              onChange={(value) => onStatusFilterChange(value as GroupStatusFilter)}
            />
            <Button
              size="small"
              type={showUngroupedOnly ? 'primary' : 'default'}
              onClick={() => onShowUngroupedOnlyChange(!showUngroupedOnly)}
            >
              未分组
            </Button>
            <Button icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>
              刷新
            </Button>
          </Space>
        </div>

        {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(260px, 320px) minmax(0, 1fr)',
            gap: 12,
            alignItems: 'start'
          }}
        >
          {showUngroupedOnly ? (
            <ProductUngroupedPanel products={filteredUngroupedProducts} onOpenDetail={openProductDetail} />
          ) : (
            <>
              <ProductGroupListPane
                groups={filteredGroups}
                groupKeyword={groupKeyword}
                selectedGroupKey={selectedGroup?.key}
                onGroupKeywordChange={onGroupKeywordChange}
                onSelectGroup={onSelectGroup}
              />
              <ProductGroupDetailPanel group={selectedGroup} activeOwnerId={activeOwnerId} workspace={workspace} />
            </>
          )}
        </div>
      </Space>
    </div>
  );
}
