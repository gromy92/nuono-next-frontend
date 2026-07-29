import { useState } from 'react';
import { Button, message, Popconfirm, Popover, Space, Switch, Tag, Tooltip, Typography } from 'antd';
import type { ProductListRowPayload } from '../types';
import { getProductListRowIdentityKey } from '../../product-domain/productIdentity';
import {
  hasProductBlockingIssues,
  isLiveStatusActive,
  isProductIssueBlocking,
  productListIssueTags,
  productIssueTagLabel,
  productSummaryPrimaryLiveStatus
} from '../utils/status';
import { buildProductSummarySurfaceFromListItem } from '../../product-baseline';

const { Text } = Typography;

function ProductIssuePopoverContent({ issues }: { issues: string[] }) {
  const hasBlockingIssues = hasProductBlockingIssues(issues);

  return (
    <Space direction="vertical" size={8} style={{ minWidth: 260, maxWidth: 360 }}>
      <Text strong style={{ color: hasBlockingIssues ? '#b91c1c' : '#92400e' }}>
        {hasBlockingIssues ? '当前问题会阻断上架' : '当前问题需要核对'}
      </Text>
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        {issues.map((issue, index) => {
          const blocking = isProductIssueBlocking(issue);
          const label = productIssueTagLabel(issue);
          return (
            <Space key={`${issue}-${index}`} direction="vertical" size={2} style={{ width: '100%' }}>
              <Space size={6} wrap>
                <Tag color={blocking ? 'error' : 'warning'} style={{ marginInlineEnd: 0 }}>
                  {blocking ? '阻断' : '待核对'}
                </Tag>
                <Text strong>{label}</Text>
              </Space>
              {label !== issue ? (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {issue}
                </Text>
              ) : null}
            </Space>
          );
        })}
      </Space>
      <Text type="secondary" style={{ fontSize: 12 }}>
        处理完成后刷新或重新同步商品状态。
      </Text>
    </Space>
  );
}

export function LiveStatusCell(props: {
  record: ProductListRowPayload;
  usingMockProductList: boolean;
  updateProductListLiveStatus: (skuParent: string | undefined, liveActive: boolean) => void;
}) {
  const {
    record,
    usingMockProductList,
    updateProductListLiveStatus
  } = props;
  const [downConfirmOpen, setDownConfirmOpen] = useState(false);
  const summary = buildProductSummarySurfaceFromListItem(record);
  const primaryLiveStatus = productSummaryPrimaryLiveStatus(summary);
  const liveActive = isLiveStatusActive(primaryLiveStatus);
  const issueTags = productListIssueTags(record);
  const hasIssues = issueTags.length > 0;
  const hasBlockingIssues = hasProductBlockingIssues(issueTags);
  const canTurnOn = usingMockProductList && (liveActive || !hasBlockingIssues);
  const disabledTip = !usingMockProductList
    ? '请进入商品详情的 Offer 区修改在架状态，并点击发布当前修改。'
    : !canTurnOn
      ? '商品存在阻断问题，处理后才能上架'
      : undefined;

  const commitLiveStatus = (nextLiveActive: boolean) => {
    updateProductListLiveStatus(getProductListRowIdentityKey(record), nextLiveActive);
    message.success(nextLiveActive ? '已标记为上架' : '已标记为下架');
  };

  const liveSwitch = (
    <Switch
      size="small"
      checked={liveActive}
      disabled={!canTurnOn}
      checkedChildren="在线"
      unCheckedChildren="下架"
      onChange={(nextLiveActive, event) => {
        event.stopPropagation();
        if (nextLiveActive) {
          commitLiveStatus(true);
          return;
        }
        setDownConfirmOpen(true);
      }}
    />
  );

  return (
    <Space direction="vertical" size={6} align="start">
      {record.maintenanceEnabled !== false ? (
        <Text style={{ color: '#166534', fontSize: 12, fontWeight: 600, lineHeight: '16px' }}>
          诺诺维护中
        </Text>
      ) : null}
      <Popconfirm
        open={downConfirmOpen}
        title="确认下架当前商品？"
        description="下架后该商品将标记为不在线。"
        okText="确认下架"
        cancelText="取消"
        onConfirm={(event) => {
          event?.stopPropagation();
          setDownConfirmOpen(false);
          commitLiveStatus(false);
        }}
        onCancel={(event) => {
          event?.stopPropagation();
          setDownConfirmOpen(false);
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDownConfirmOpen(false);
          }
        }}
      >
        <Tooltip title={disabledTip}>
          <span onClick={(event) => event.stopPropagation()}>{liveSwitch}</span>
        </Tooltip>
      </Popconfirm>
      {hasIssues ? (
        <Popover
          trigger={['click', 'hover']}
          title="商品问题"
          content={<ProductIssuePopoverContent issues={issueTags} />}
        >
          <Button
            type="link"
            danger={hasBlockingIssues}
            style={{
              height: 20,
              padding: 0,
              fontSize: 12,
              color: hasBlockingIssues ? undefined : '#d97706'
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            查看问题
          </Button>
        </Popover>
      ) : null}
    </Space>
  );
}
