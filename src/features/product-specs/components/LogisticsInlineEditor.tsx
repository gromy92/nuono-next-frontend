import { Select } from 'antd'
import { logisticsFieldConfigs, type LogisticsOption } from '../specPageConfig'
import { defaultLogisticsProfile, isConfirmedLogisticsValue, logisticsValueKind } from '../specDomain'
import type { ProductLogisticsProfilePayload, ProductVariantSpecPayload } from '../types'

export function LogisticsInlineEditor(props: {
  row: ProductVariantSpecPayload;
  saving: boolean;
  savingBlocked: boolean;
  onChange: (row: ProductVariantSpecPayload, patch: Partial<ProductLogisticsProfilePayload>) => void | Promise<void>;
}) {
  const { row, saving, savingBlocked, onChange } = props;
  const profile = {
    ...defaultLogisticsProfile(row, row.storeCode),
    ...row.logisticsProfile
  };
  const disabled = savingBlocked;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 5,
        alignItems: 'end',
        width: 240,
        maxWidth: '100%',
        minWidth: 0
      }}
    >
      {logisticsFieldConfigs.map((config) => (
        <LogisticsSelectField
          key={config.field}
          ariaLabel={config.ariaLabel}
          testId={row.variantId ? `product-specs-logistics-select-${config.field}-${row.variantId}` : undefined}
          value={profile[config.field] || 'unknown'}
          options={config.options}
          disabled={disabled}
          saving={saving}
          onChange={(value) => void onChange(row, { [config.field]: value })}
        />
      ))}
    </div>
  );
}

export function LogisticsSelectField(props: {
  ariaLabel: string;
  testId?: string;
  value?: string;
  options: LogisticsOption[];
  disabled?: boolean;
  saving?: boolean;
  onChange: (value: string) => void;
}) {
  const { ariaLabel, testId, value, options, disabled, saving, onChange } = props;
  const normalizedValue = value || 'unknown';
  const confirmed = isConfirmedLogisticsValue(normalizedValue);
  const valueKind = logisticsValueKind(normalizedValue);
  return (
    <label aria-label={ariaLabel} style={{ display: 'grid', gap: 3, minWidth: 0 }}>
      <Select
        data-testid={testId}
        aria-label={ariaLabel}
        size="small"
        value={normalizedValue}
        options={options}
        disabled={disabled}
        suffixIcon={null}
        className={[
          'product-specs-logistics-select',
          confirmed ? 'product-specs-logistics-select--confirmed' : 'product-specs-logistics-select--missing',
          valueKind === 'none' ? 'product-specs-logistics-select--none' : '',
          valueKind === 'included' ? 'product-specs-logistics-select--included' : '',
          saving ? 'product-specs-logistics-select--saving' : ''
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ width: '100%', minWidth: 0 }}
        onChange={onChange}
      />
    </label>
  );
}

