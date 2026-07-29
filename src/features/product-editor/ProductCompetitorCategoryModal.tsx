import { LinkOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Table, Tag, Typography } from 'antd';
import {
  preferredCompetitorCategoryLabel,
  type ProductCompetitorContentMaterial
} from '../product-domain/productCompetitorContent';

const { Text } = Typography;

type ProductCompetitorCategoryRow = {
  rowKey: string;
  competitorLabel: string;
  sourceHost: string;
  categoryPath: string;
  categoryUrl: string;
  productUrl: string;
  categoryValue: string;
};

function categoryTextValue(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

function sourceHostFromUrl(value?: string) {
  try {
    return new URL(categoryTextValue(value)).host;
  } catch {
    return '';
  }
}

function isCategoryLikeUrl(value?: string) {
  const normalized = categoryTextValue(value).toLowerCase();
  if (!normalized) {
    return false;
  }
  return (
    normalized.includes('/c/') ||
    normalized.includes('/category') ||
    normalized.includes('/categories') ||
    normalized.includes('/search') ||
    normalized.includes('/s?') ||
    normalized.includes('?rh=') ||
    normalized.includes('&rh=')
  );
}

function competitorLabel(material: ProductCompetitorContentMaterial, index: number) {
  return (
    categoryTextValue(material.titleEn) ||
    categoryTextValue(material.titleAr) ||
    categoryTextValue(material.note) ||
    categoryTextValue(material.url) ||
    `竞品 ${index + 1}`
  );
}

function buildProductCompetitorCategoryRows(
  materials: ProductCompetitorContentMaterial[] = []
): ProductCompetitorCategoryRow[] {
  return materials.flatMap((material, materialIndex) => {
    const sourceHost = categoryTextValue(material.sourceHost) || sourceHostFromUrl(material.url);
    const productUrl = categoryTextValue(material.url);
    const label = competitorLabel(material, materialIndex);
    const explicitLinks = (material.categoryLinks || []).filter(
      (item) => categoryTextValue(item.url) || categoryTextValue(item.path) || categoryTextValue(item.name)
    );

    if (explicitLinks.length) {
      return explicitLinks.map((item, linkIndex) => {
        const categoryValue = categoryTextValue(item.path) || categoryTextValue(item.name);
        return {
          rowKey: `${material.id || materialIndex}-${linkIndex}`,
          competitorLabel: label,
          sourceHost,
          categoryPath: preferredCompetitorCategoryLabel(categoryValue, material, item.url) || '未命名类目',
          categoryUrl: categoryTextValue(item.url),
          productUrl,
          categoryValue
        };
      });
    }

    const categoryUrl =
      categoryTextValue(material.categoryUrl) || (isCategoryLikeUrl(productUrl) ? productUrl : '');
    const categoryValue =
      categoryTextValue(material.categoryPath) || categoryTextValue(material.categoryName);
    if (!categoryValue && !categoryUrl) {
      return [];
    }
    return [
      {
        rowKey: material.id || String(materialIndex),
        competitorLabel: label,
        sourceHost,
        categoryPath: preferredCompetitorCategoryLabel(categoryValue, material, categoryUrl) || label,
        categoryUrl,
        productUrl,
        categoryValue
      }
    ];
  });
}

export function ProductCompetitorCategoryModal(props: {
  open: boolean;
  materials?: ProductCompetitorContentMaterial[];
  officialFulltypeInput: React.ReactNode;
  onClose: () => void;
  onUseFulltype: (value: string) => void;
  isOfficialFulltype: (value: string) => boolean;
}) {
  const { open, materials, officialFulltypeInput, onClose, onUseFulltype, isOfficialFulltype } = props;
  const rows = buildProductCompetitorCategoryRows(materials);

  return (
    <Modal
      title="编辑类目"
      open={open}
      width={920}
      destroyOnClose={false}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          完成
        </Button>
      ]}
      onCancel={onClose}
    >
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <Space direction="vertical" size={6} style={{ width: '100%' }}>
          <Text strong>当前官方类目</Text>
          {officialFulltypeInput}
        </Space>
        <Space align="center" size={8}>
          <Text strong>竞品类目</Text>
          <Tag color="blue" style={{ marginInlineEnd: 0 }}>
            {rows.length}
          </Tag>
        </Space>
        <Table<ProductCompetitorCategoryRow>
          data-testid="product-listing-competitor-category-table"
          rowKey="rowKey"
          size="small"
          pagination={false}
          dataSource={rows}
          columns={[
            {
              title: '竞品',
              dataIndex: 'competitorLabel',
              width: 260,
              render: (value: string) => (
                <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                  {value}
                </Typography.Paragraph>
              )
            },
            {
              title: '来源',
              dataIndex: 'sourceHost',
              width: 130,
              render: (value: string) => value || '-'
            },
            {
              title: '类目',
              dataIndex: 'categoryPath',
              render: (value: string) => (
                <Text type={value === '暂无类目链接' ? 'secondary' : undefined}>{value}</Text>
              )
            },
            {
              title: '链接',
              width: 160,
              render: (_, record) => (
                <Space size={8}>
                  {record.categoryUrl ? (
                    <Typography.Link href={record.categoryUrl} target="_blank" rel="noreferrer">
                      类目
                    </Typography.Link>
                  ) : null}
                  {record.productUrl ? (
                    <Typography.Link href={record.productUrl} target="_blank" rel="noreferrer">
                      商品
                    </Typography.Link>
                  ) : null}
                  {!record.categoryUrl && !record.productUrl ? <Text type="secondary">暂无</Text> : null}
                </Space>
              )
            },
            {
              title: '操作',
              width: 110,
              render: (_, record) => (
                <Button
                  size="small"
                  icon={<LinkOutlined />}
                  disabled={!isOfficialFulltype(record.categoryValue)}
                  title={
                    isOfficialFulltype(record.categoryValue)
                      ? '填入官方 Product Fulltype'
                      : '竞品前台类目仅供参考，请从官方类目列表选择'
                  }
                  onClick={() => onUseFulltype(record.categoryValue)}
                >
                  填入
                </Button>
              )
            }
          ]}
          locale={{ emptyText: '当前上架资料暂无竞品类目' }}
        />
      </Space>
    </Modal>
  );
}
