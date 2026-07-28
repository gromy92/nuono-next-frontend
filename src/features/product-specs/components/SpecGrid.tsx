import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons'
import { Button, InputNumber, Space, Tag, Tooltip, Typography } from 'antd'
import {
  cartonSpecFields, productSpecFields, type EditableSourceType, type SpecNumberField, type SpecSourceDraft
} from '../specPageConfig'
import { formatCompactNumber, headerCellStyle, specGridStyle } from '../specDomain'
import type { ProductVariantSpecPayload, ProductVariantSpecSourcePayload, ProductVariantSpecSourceType } from '../types'

const { Text } = Typography

export function SpecGridHeader(props: { includeCarton: boolean; includeSource: boolean; includeEffective?: boolean }) {
  const { includeCarton, includeSource, includeEffective = false } = props;
  return (
    <div style={specGridStyle({ includeCarton, includeSource, includeEffective })}>
      {includeEffective ? <span aria-hidden="true" /> : null}
      {includeSource ? <Text type="secondary" style={headerCellStyle}>来源</Text> : null}
      {productSpecFields.map((field) => (
        <Text key={field.key} type="secondary" style={headerCellStyle}>
          {field.label}
        </Text>
      ))}
      {includeCarton ? (
        <>
          {cartonSpecFields.map((field) => (
            <Text key={field.key} type="secondary" style={headerCellStyle}>
              {field.label}
            </Text>
          ))}
        </>
      ) : null}
    </div>
  );
}

export function SpecGridRow(props: {
  label: string;
  color: string;
  row?: ProductVariantSpecPayload;
  sourceType?: EditableSourceType;
  cellTestSourceType?: ProductVariantSpecSourceType;
  sourceTestId?: string;
  source?: ProductVariantSpecSourcePayload;
  fallback?: ProductVariantSpecPayload;
  includeCarton: boolean;
  showCartonFields?: boolean;
  showSource?: boolean;
  editable?: boolean;
  effective?: boolean;
  editing?: boolean;
  reserveEffectiveColumn?: boolean;
  draft?: SpecSourceDraft;
  saving?: boolean;
  selectingEffective?: boolean;
  selectingEffectiveBlocked?: boolean;
  onStartEdit?: (row: ProductVariantSpecPayload, sourceType: EditableSourceType) => void;
  onDraftNumberChange?: (field: SpecNumberField, value: number | string | null) => void;
  onCancelEdit?: () => void;
  onSaveSource?: (row: ProductVariantSpecPayload, sourceType: EditableSourceType) => void;
  onSelectEffectiveSource?: (row: ProductVariantSpecPayload, sourceType: EditableSourceType) => void;
}) {
  const {
    label,
    color,
    row,
    sourceType,
    cellTestSourceType,
    sourceTestId,
    source,
    fallback,
    includeCarton,
    showCartonFields = includeCarton,
    showSource = true,
    editable,
    effective,
    editing,
    reserveEffectiveColumn,
    draft,
    saving,
    selectingEffective,
    selectingEffectiveBlocked,
    onStartEdit,
    onDraftNumberChange,
    onCancelEdit,
    onSaveSource,
    onSelectEffectiveSource
  } = props;
  const valueSource = source || fallback;
  const fields = showCartonFields ? [...productSpecFields, ...cartonSpecFields] : productSpecFields;
  const testSourceType = cellTestSourceType || sourceType;
  const canSelectEffective = Boolean(editable && row && sourceType && source?.sourceId);
  const includeEffectiveColumn = Boolean(editable || reserveEffectiveColumn);
  return (
    <div style={specGridStyle({ includeCarton, includeSource: showSource, includeEffective: includeEffectiveColumn })}>
      {editable ? (
        <Tooltip title={canSelectEffective ? '物流计算使用此来源' : '请先维护该来源规格'}>
          <Button
            type="text"
            size="small"
            aria-label={`设为生效${label}规格`}
            icon={effective ? <CheckOutlined /> : undefined}
            loading={selectingEffective}
            disabled={!canSelectEffective || Boolean(editing) || Boolean(selectingEffectiveBlocked)}
            style={{
              width: 20,
              minWidth: 20,
              height: 20,
              padding: 0,
              borderRadius: 10,
              color: effective ? '#16a34a' : '#94a3b8',
              border: effective ? '1px solid #86efac' : '1px solid #cbd5e1',
              background: effective ? '#f0fdf4' : '#ffffff',
              lineHeight: '18px'
            }}
            onClick={() => {
              if (!effective && row && sourceType) {
                onSelectEffectiveSource?.(row, sourceType);
              }
            }}
          />
        </Tooltip>
      ) : reserveEffectiveColumn ? (
        <Tooltip title={effective ? '当前经营生效来源' : '仓管规格由 APP 维护'}>
          <span
            aria-label={effective ? `当前生效${label}规格` : undefined}
            style={{
              display: 'inline-flex',
              width: 20,
              height: 20,
              alignItems: 'center',
              justifyContent: 'center',
              color: effective ? '#16a34a' : '#cbd5e1'
            }}
          >
            {effective ? <CheckOutlined /> : null}
          </span>
        </Tooltip>
      ) : null}
      {showSource ? (
        <Space size={4} wrap style={{ minWidth: 0 }}>
          <Tag color={color} style={{ marginInlineEnd: 0 }}>
            <span data-testid={sourceTestId}>{label}</span>
          </Tag>
          {editable && row && sourceType && !editing ? (
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                aria-label={`编辑${label}规格`}
                icon={<EditOutlined />}
                style={{ width: 20, height: 20 }}
                onClick={() => onStartEdit?.(row, sourceType)}
              />
            </Tooltip>
          ) : null}
          {editable && row && sourceType && editing ? (
            <Space size={0}>
              <Tooltip title="保存">
                <Button
                  type="text"
                  size="small"
                  aria-label={`保存${label}规格`}
                  icon={<CheckOutlined />}
                  loading={saving}
                  style={{ width: 20, height: 20, color: '#16a34a' }}
                  onClick={() => onSaveSource?.(row, sourceType)}
                />
              </Tooltip>
              <Tooltip title="取消">
                <Button
                  type="text"
                  size="small"
                  aria-label={`取消编辑${label}规格`}
                  icon={<CloseOutlined />}
                  disabled={saving}
                  style={{ width: 20, height: 20, color: '#64748b' }}
                  onClick={onCancelEdit}
                />
              </Tooltip>
            </Space>
          ) : null}
        </Space>
      ) : null}
      {fields.map((field) =>
        editing ? (
          <InputNumber
            key={field.key}
            size="small"
            controls={false}
            min={field.min}
            precision={field.precision}
            value={draft?.[field.key] ?? null}
            style={{ width: '100%', minWidth: 0 }}
            onChange={(value) => onDraftNumberChange?.(field.key, value)}
          />
        ) : (
          <SpecValue
            key={field.key}
            value={valueSource?.[field.key]}
            testId={
              row?.variantId && testSourceType
                ? `product-specs-spec-cell-${testSourceType}-${field.key}-${row.variantId}`
                : undefined
            }
          />
        )
      )}
    </div>
  );
}

export function SpecValue({ value, testId }: { value?: number; testId?: string }) {
  return (
    <Text data-testid={testId} style={{ display: 'block', width: '100%', fontSize: 12, whiteSpace: 'nowrap' }}>
      {value == null ? '-' : formatCompactNumber(value)}
    </Text>
  );
}

