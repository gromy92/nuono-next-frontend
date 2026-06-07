import { Input, Modal, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { formatSnapshotValue } from '../utils';
import { ProductBaselineIdentity } from '../../product-baseline';

const { Text } = Typography;

const FIELD_LABEL_STYLE = { display: 'block', color: 'var(--pm-text-muted)', marginBottom: 6 } as const;

export type ProductGroupMemberDraft = {
  skuParent: string;
  childSku?: string;
  brand?: string;
  title?: string;
  imageUrl?: string;
  galleryImages?: string[];
  partnerSku?: string;
  totalFbnStock?: number;
  totalFbpStock?: number;
  axisValue?: string;
  axisValues?: Record<string, string>;
  axisRows?: Array<{ code?: string; label: string; value?: string }>;
};

type ProductGroupMemberEditModalProps = {
  axisLabel?: string;
  initialValue: ProductGroupMemberDraft;
  open: boolean;
  submitDisabled?: boolean;
  onCancel: () => void;
  onSubmit: (draft: ProductGroupMemberDraft) => void;
};

export function ProductGroupMemberEditModal(props: ProductGroupMemberEditModalProps) {
  const { axisLabel, initialValue, open, submitDisabled = false, onCancel, onSubmit } = props;
  const [axisValue, setAxisValue] = useState(initialValue.axisValue ?? '');
  const [axisValues, setAxisValues] = useState<Record<string, string>>({});
  const label = axisLabel || 'Group Attribute';
  const fbnStock = Number(initialValue.totalFbnStock ?? 0);
  const fbpStock = Number(initialValue.totalFbpStock ?? 0);
  const displayPsku = initialValue.partnerSku || initialValue.childSku || initialValue.skuParent;
  const imageUrl = initialValue.imageUrl || initialValue.galleryImages?.[0];
  const imageCount = initialValue.galleryImages?.length ?? (imageUrl ? 1 : 0);
  const axisRows = initialValue.axisRows?.length
    ? initialValue.axisRows
    : [{ code: undefined, label, value: initialValue.axisValue }];

  useEffect(() => {
    if (open) {
      setAxisValue(initialValue.axisValue ?? '');
      const nextAxisValues: Record<string, string> = {};
      initialValue.axisRows?.forEach((row) => {
        if (row.code) {
          nextAxisValues[row.code] = initialValue.axisValues?.[row.code] ?? row.value ?? '';
        }
      });
      setAxisValues(nextAxisValues);
    }
  }, [initialValue.axisRows, initialValue.axisValue, initialValue.axisValues, open]);

  const updateAxisRowValue = (code: string | undefined, value: string) => {
    if (!code) {
      setAxisValue(value);
      return;
    }
    setAxisValues((currentValue) => ({
      ...currentValue,
      [code]: value
    }));
    if (code === axisRows[0]?.code) {
      setAxisValue(value);
    }
  };

  const submitDraft = () => {
    const nextAxisValues: Record<string, string> = {};
    axisRows.forEach((row) => {
      if (row.code) {
        nextAxisValues[row.code] = (axisValues[row.code] ?? row.value ?? '').trim();
      }
    });
    const firstAxisValue = axisRows[0]?.code ? nextAxisValues[axisRows[0].code] : axisValue.trim();
    onSubmit({
      ...initialValue,
      axisValue: firstAxisValue,
      axisValues: nextAxisValues,
      axisRows: axisRows.map((row) => ({
        ...row,
        value: row.code ? nextAxisValues[row.code] : firstAxisValue
      }))
    });
  };

  return (
    <Modal
      title={`Edit ${label}`}
      open={open}
      okText="确定"
      okButtonProps={{ disabled: submitDisabled }}
      onCancel={onCancel}
      onOk={submitDraft}
      destroyOnClose
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div
          style={{
            padding: 14,
            border: '1px solid var(--pm-subtle-border)',
            borderRadius: 8,
            background: 'var(--pm-subtle-bg)'
          }}
        >
          <ProductBaselineIdentity
            title={initialValue.title || initialValue.skuParent}
            imageUrl={imageUrl}
            imageCount={imageCount}
            imageAlt={initialValue.title || initialValue.skuParent}
            imageWidth={88}
            titleMaxWidth={360}
            codes={[
              {
                label: 'PSKU',
                value: formatSnapshotValue(displayPsku),
                copyText: displayPsku
              },
              {
                label: 'SKU',
                value: formatSnapshotValue(initialValue.skuParent),
                copyText: initialValue.skuParent
              }
            ]}
            extra={
              <Text type="secondary" style={{ fontSize: 12, lineHeight: '18px' }}>
                库存 FBN {Number.isFinite(fbnStock) ? fbnStock : 0} / FBP {Number.isFinite(fbpStock) ? fbpStock : 0}
              </Text>
            }
          />
        </div>
        {axisRows.map((row) => (
          <div key={row.code || row.label}>
            <Text style={FIELD_LABEL_STYLE}>{row.label || label}</Text>
            <Input
              value={row.code ? axisValues[row.code] ?? row.value ?? '' : axisValue}
              onChange={(event) => updateAxisRowValue(row.code, event.target.value)}
            />
          </div>
        ))}
      </Space>
    </Modal>
  );
}
