import { Col, Empty, Progress, Row, Space, Tag, Typography } from 'antd';
import { buildDetailedAttributeGroups, mergeDetailedAttributeField } from '../productAttributeTemplate';
import type { ProductFieldDomainSurface, ProductMasterSnapshotPayload } from '../types';
import { formatSnapshotValue } from '../utils';
import {
  arabicDisplayValue,
  attributeCode,
  attributeFilled,
  buildAttributeMap,
  dimensionUnitValue,
  englishDisplayValue,
  groupRecords,
  ProductAttributeReadonlyValue,
  ProductAttributeValueInput,
  writableAttributeField
} from './ProductAttributeFieldControl';
import { ProductDetailSection } from './ProductDetailSection';

const { Text } = Typography;

function pairAttributeRows<T>(rows: T[]): T[][] {
  const pairs: T[][] = [];
  for (let index = 0; index < rows.length; index += 2) {
    pairs.push(rows.slice(index, index + 2));
  }
  return pairs;
}

export function ProductAttributesPanel(props: {
  productAttributesDomain?: ProductFieldDomainSurface;
  productSnapshotView?: ProductMasterSnapshotPayload;
  updateProductAttributeField: (code: string, field: string, value: string) => void;
}) {
  const { productAttributesDomain, productSnapshotView, updateProductAttributeField } = props;
  const attributeRecords = productSnapshotView?.keyAttributes ?? [];
  const attributeMap = buildAttributeMap(attributeRecords);
  const attributeGroups = buildDetailedAttributeGroups(attributeRecords);
  const allFields = attributeGroups.flatMap((group) => group.fields);
  const totalFilled = allFields.filter((field) => {
    const record = attributeMap.get(field.code) ?? {};
    return attributeFilled(record, mergeDetailedAttributeField(field, record));
  }).length;
  const totalCount = allFields.length;

  return (
    <ProductDetailSection
      title="Detailed Content"
      domain={productAttributesDomain}
      extra={
        <Tag color={totalFilled === totalCount ? 'success' : 'warning'} style={{ marginInlineEnd: 0 }}>
          {totalFilled}/{totalCount} Attributes
        </Tag>
      }
    >
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        {attributeGroups.map((group) => {
          const rows = groupRecords(group, attributeMap).map(({ field, record }) => ({
            field: mergeDetailedAttributeField(field, record),
            record
          }));
          const filledCount = rows.filter(({ field, record }) => attributeFilled(record, field)).length;

          return (
            <div key={group.key}>
              <Space align="center" size={10} style={{ width: '100%', marginBottom: 12 }}>
                <Text strong style={{ color: 'var(--pm-text-primary)', fontSize: 15 }}>
                  {group.title}
                </Text>
                <Progress percent={Math.round((filledCount / group.fields.length) * 100)} size="small" showInfo={false} style={{ flex: 1, minWidth: 120 }} />
                <Text type="secondary">
                  {filledCount}/{group.fields.length} Attributes
                </Text>
              </Space>
              {rows.length ? (
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  {pairAttributeRows(rows).map((pair, pairIndex) => (
                    <Row key={`${group.key}-${pairIndex}`} gutter={[16, 8]} align="top">
                      {pair.map(({ field, record }) => {
                        const code = attributeCode(record) || field.code;
                        const englishValue = englishDisplayValue(record, field);
                        const arabicValue = arabicDisplayValue(record, field);
                        const unitValue = dimensionUnitValue(record);

                        return [
                          <Col key={`${field.code}-en`} xs={24} md={12} xl={6}>
                            <Text strong style={{ display: 'block', color: 'var(--pm-text-primary)', marginBottom: 6 }}>
                              {field.label}
                            </Text>
                            <ProductAttributeValueInput
                              editable={Boolean(attributeMap.get(field.code))}
                              field={field}
                              unit={unitValue}
                              value={englishValue}
                              onChange={(value) => updateProductAttributeField(code, writableAttributeField(record, field), value)}
                              onUnitChange={(value) => updateProductAttributeField(code, 'unit', value)}
                            />
                          </Col>,
                          <Col key={`${field.code}-ar`} xs={24} md={12} xl={6}>
                            <Text aria-hidden style={{ display: 'block', marginBottom: 6 }}>
                              &nbsp;
                            </Text>
                            <ProductAttributeReadonlyValue field={field} unit={unitValue} value={arabicValue} />
                          </Col>
                        ];
                      })}
                    </Row>
                  ))}
                </Space>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={formatSnapshotValue(group.title)} />
              )}
            </div>
          );
        })}
      </Space>
    </ProductDetailSection>
  );
}
