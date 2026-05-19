import { Collapse, Descriptions, Divider, Space, Tag, Typography } from 'antd';
import { formatSnapshotValue } from '../utils';

const { Text } = Typography;

export function ProductContentStatusPanel(props: {
  productPlatformSignals: Record<string, unknown>;
  productPlatformRejectionReasons: string[];
  productPlatformAffectingAttributes: string[];
}) {
  const { productPlatformSignals, productPlatformRejectionReasons, productPlatformAffectingAttributes } = props;

  return (
    <Collapse
      bordered
      style={{ background: 'var(--pm-section-bg)' }}
      items={[
        {
          key: 'qc-status',
          label: (
            <Space wrap size={[8, 8]}>
              <Text strong style={{ color: 'var(--pm-text-primary)' }}>
                QC 状态(只读)
              </Text>
              {productPlatformRejectionReasons.length ? (
                <Tag color="warning" style={{ marginInlineEnd: 0 }}>
                  {productPlatformRejectionReasons.length} 项驳回
                </Tag>
              ) : null}
            </Space>
          ),
          children: (
            <>
              <Descriptions column={{ xs: 1, md: 2, xl: 3 }} size="small" colon={false}>
                <Descriptions.Item label="English Content Status">
                  {formatSnapshotValue(productPlatformSignals.statusQc)}
                </Descriptions.Item>
                <Descriptions.Item label="Arabic Content Status">
                  {formatSnapshotValue(productPlatformSignals.qcApproved)}
                </Descriptions.Item>
                <Descriptions.Item label="平台激活">
                  {formatSnapshotValue(productPlatformSignals.isActiveLocalized)}
                </Descriptions.Item>
                <Descriptions.Item label="必填完整度">
                  {formatSnapshotValue(productPlatformSignals.completenessMandatory)}
                </Descriptions.Item>
                <Descriptions.Item label="本地化完整度">
                  {formatSnapshotValue(productPlatformSignals.completenessLocalized)}
                </Descriptions.Item>
                <Descriptions.Item label="QC 来源">
                  {formatSnapshotValue(productPlatformSignals.qcSource)}
                </Descriptions.Item>
                <Descriptions.Item label="图片状态">
                  {formatSnapshotValue(productPlatformSignals.statusImages)}
                </Descriptions.Item>
                <Descriptions.Item label="图片数量">
                  {formatSnapshotValue(productPlatformSignals.imageCount)}
                </Descriptions.Item>
                <Descriptions.Item label="隐藏图片">
                  {formatSnapshotValue(productPlatformSignals.hiddenImageCount)}
                </Descriptions.Item>
              </Descriptions>

              {productPlatformRejectionReasons.length ? (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    驳回原因
                  </Text>
                  <Space wrap size={[8, 8]}>
                    {productPlatformRejectionReasons.map((item) => (
                      <Tag key={item} color="warning" style={{ marginInlineEnd: 0 }}>
                        {item}
                      </Tag>
                    ))}
                  </Space>
                </>
              ) : null}

              {productPlatformAffectingAttributes.length ? (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    影响字段
                  </Text>
                  <Space wrap size={[8, 8]}>
                    {productPlatformAffectingAttributes.map((item) => (
                      <Tag key={item} color="default" style={{ marginInlineEnd: 0 }}>
                        {item}
                      </Tag>
                    ))}
                  </Space>
                </>
              ) : null}
            </>
          )
        }
      ]}
    />
  );
}
