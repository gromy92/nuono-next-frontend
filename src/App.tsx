import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  App as AntdApp,
  Card,
  Col,
  ConfigProvider,
  Descriptions,
  List,
  Layout,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography
} from 'antd';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Paragraph, Text, Title } = Typography;

type BootstrapPayload = {
  application: string;
  status: string;
  phase: string;
  time: string;
  nextModules: string[];
  database: {
    enabled: boolean;
    schema: string;
    expectedCoreTables: string[];
    mode: string;
    message?: string;
    ready?: boolean;
    existingCoreTables?: string[];
    missingCoreTables?: string[];
    initScripts?: string[];
  };
};

type BootstrapState =
  | { status: 'loading' }
  | { status: 'success'; data: BootstrapPayload }
  | { status: 'error'; message: string };

type FoundationOverviewPayload = {
  mode: string;
  ready: boolean;
  message?: string;
  missingCoreTables: string[];
  counts?: {
    roleCount: number;
    userCount: number;
    activeUserCount: number;
    storeLinkCount: number;
    authorizedStoreCount: number;
    noonBindingUserCount: number;
  };
  sampleUsers: Array<{
    id: number;
    accountNo: string;
    realName?: string;
    phone?: string;
    accountType?: string;
    companyName?: string;
    status?: number;
    roleName?: string;
    storeCount?: number;
    authorizedStoreCount?: number;
    sites?: string;
    bindingStatus: string;
  }>;
};

type FoundationOverviewState =
  | { status: 'loading' }
  | { status: 'success'; data: FoundationOverviewPayload }
  | { status: 'error'; message: string };

const moduleMeta: Record<string, { title: string; desc: string }> = {
  auth: {
    title: '账号与登录',
    desc: '先跑通登录识别、账号状态和最小访问控制。'
  },
  user: {
    title: '用户管理',
    desc: '沉淀新系统用户主数据，为组织关系和绑定链路打底。'
  },
  role: {
    title: '角色与权限',
    desc: '围绕角色、菜单、用户菜单建立可演进的 RBAC 骨架。'
  },
  store: {
    title: '店铺与站点',
    desc: '重建店铺授权、站点聚合和组织归属展示。'
  },
  binding: {
    title: 'Noon 绑定',
    desc: '补齐绑定状态、异常修复入口和主账号关系。'
  }
};

const foundationTracks = [
  '旧系统只做稳态维护，新系统在 `nuono-next/` 独立推进。',
  '本地开发库使用 `nuono_new_dev`，生产库只作只读参考。',
  '第一批核心表优先包含 `role`、`menu`、`role_menu`、`user`、`user_menu`、`user_store`。',
  '底座链路跑通后，再补任务、看板、约仓等第二批业务表。'
];

const nextActions = [
  '优先用 `backend/src/main/resources/db/init/000_local_dev_bootstrap.sql` 完成本机冷启动。',
  '需要贴近旧系统结构时，再切到 `001_clone_legacy_core_tables.sql` 和 `002_import_whitelist_sample.sql`。',
  '优先落登录、用户、角色、店铺、Noon 绑定主链路，再补首页、任务、消息。'
];

function App() {
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>({ status: 'loading' });
  const [foundationState, setFoundationState] = useState<FoundationOverviewState>({
    status: 'loading'
  });

  useEffect(() => {
    let cancelled = false;

    async function loadBootstrap() {
      try {
        const response = await fetch('/api/system/bootstrap');

        if (!response.ok) {
          throw new Error(`后端返回 ${response.status}`);
        }

        const payload = (await response.json()) as BootstrapPayload;

        if (!cancelled) {
          setBootstrapState({ status: 'success', data: payload });
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : '后端链路暂时不可用';
          setBootstrapState({ status: 'error', message });
        }
      }
    }

    async function loadFoundationOverview() {
      try {
        const response = await fetch('/api/system/foundation-overview');

        if (!response.ok) {
          throw new Error(`后端返回 ${response.status}`);
        }

        const payload = (await response.json()) as FoundationOverviewPayload;

        if (!cancelled) {
          setFoundationState({ status: 'success', data: payload });
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : '基础样本概览暂时不可用';
          setFoundationState({ status: 'error', message });
        }
      }
    }

    void loadBootstrap();
    void loadFoundationOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  const moduleCards = useMemo(() => {
    const keys =
      bootstrapState.status === 'success'
        ? bootstrapState.data.nextModules
        : ['auth', 'user', 'role', 'store', 'binding'];

    return keys.map((key) => ({
      key,
      title: moduleMeta[key]?.title ?? key,
      desc: moduleMeta[key]?.desc ?? '待补充模块说明。'
    }));
  }, [bootstrapState]);

  const foundationStats =
    foundationState.status === 'success' && foundationState.data.counts
      ? [
          { label: '角色数', value: foundationState.data.counts.roleCount },
          { label: '样本用户数', value: foundationState.data.counts.userCount },
          { label: '启用用户数', value: foundationState.data.counts.activeUserCount },
          { label: '店铺挂载数', value: foundationState.data.counts.storeLinkCount },
          { label: '已授权店铺数', value: foundationState.data.counts.authorizedStoreCount },
          { label: 'Noon 绑定用户数', value: foundationState.data.counts.noonBindingUserCount }
        ]
      : [];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0f766e',
          colorBgLayout: '#f4f7f1',
          borderRadius: 8,
          fontSize: 14
        }
      }}
    >
      <AntdApp>
        <Layout style={{ minHeight: '100vh', background: '#f4f7f1' }}>
          <Content style={{ padding: '32px 20px 48px' }}>
            <div style={{ maxWidth: 1180, margin: '0 auto' }}>
              <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 24 }}>
                <Tag color="success" style={{ width: 'fit-content', marginInlineEnd: 0 }}>
                  Nuono Next / 替换式重建
                </Tag>
                <Title level={2} style={{ margin: 0, color: '#0f172a' }}>
                  新系统最小可运行链路
                </Title>
                <Paragraph style={{ margin: 0, maxWidth: 900, color: '#475569', fontSize: 16 }}>
                  这里先对齐当前骨架状态、后端联通情况和下一批主链路，后续开发都围绕这条底座往前推进。
                </Paragraph>
              </Space>

              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} xl={14}>
                  <Card
                    title="骨架联通状态"
                    bordered={false}
                    style={{ height: '100%', boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
                  >
                    {bootstrapState.status === 'loading' ? (
                      <Space size={12}>
                        <Spin size="small" />
                        <Text>正在读取后端 bootstrap 状态...</Text>
                      </Space>
                    ) : null}

                    {bootstrapState.status === 'error' ? (
                      <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <Alert
                          type="warning"
                          showIcon
                          message="后端还没有连上"
                          description={`当前前端骨架可用，但读取 /api/system/bootstrap 失败：${bootstrapState.message}`}
                        />
                        <Descriptions column={1} size="small" colon={false}>
                          <Descriptions.Item label="前端状态">可启动，可构建</Descriptions.Item>
                          <Descriptions.Item label="当前阶段">本地骨架联调</Descriptions.Item>
                          <Descriptions.Item label="下一动作">启动 backend 后再继续联调</Descriptions.Item>
                        </Descriptions>
                      </Space>
                    ) : null}

                    {bootstrapState.status === 'success' ? (
                      <Descriptions column={1} size="small" colon={false}>
                        <Descriptions.Item label="应用">
                          {bootstrapState.data.application}
                        </Descriptions.Item>
                        <Descriptions.Item label="链路状态">
                          <Tag color="success" style={{ marginInlineEnd: 0 }}>
                            {bootstrapState.data.status}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="当前阶段">
                          {bootstrapState.data.phase}
                        </Descriptions.Item>
                        <Descriptions.Item label="最近响应时间">
                          {dayjs(bootstrapState.data.time).format('YYYY-MM-DD HH:mm:ss')}
                        </Descriptions.Item>
                        <Descriptions.Item label="下一批模块">
                          <Space wrap size={[8, 8]}>
                            {bootstrapState.data.nextModules.map((module) => (
                              <Tag key={module} color="processing" style={{ marginInlineEnd: 0 }}>
                                {moduleMeta[module]?.title ?? module}
                              </Tag>
                            ))}
                          </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="数据库模式">
                          {bootstrapState.data.database.mode}
                        </Descriptions.Item>
                        <Descriptions.Item label="目标库">
                          {bootstrapState.data.database.schema}
                        </Descriptions.Item>
                        <Descriptions.Item label="核心表准备">
                          {bootstrapState.data.database.enabled ? (
                            <Tag
                              color={bootstrapState.data.database.ready ? 'success' : 'warning'}
                              style={{ marginInlineEnd: 0 }}
                            >
                              {bootstrapState.data.database.ready ? '已齐备' : '待初始化'}
                            </Tag>
                          ) : (
                            <Text>{bootstrapState.data.database.message ?? '尚未启用本地数据库模式'}</Text>
                          )}
                        </Descriptions.Item>
                        {bootstrapState.data.database.missingCoreTables?.length ? (
                          <Descriptions.Item label="缺失核心表">
                            <Space wrap size={[8, 8]}>
                              {bootstrapState.data.database.missingCoreTables.map((table) => (
                                <Tag key={table} color="warning" style={{ marginInlineEnd: 0 }}>
                                  {table}
                                </Tag>
                              ))}
                            </Space>
                          </Descriptions.Item>
                        ) : null}
                      </Descriptions>
                    ) : null}
                  </Card>
                </Col>

                <Col xs={24} xl={10}>
                  <Card
                    title="当前边界"
                    bordered={false}
                    style={{ height: '100%', boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
                  >
                    <List
                      dataSource={foundationTracks}
                      renderItem={(item) => (
                        <List.Item style={{ paddingInline: 0 }}>
                          <Text style={{ color: '#334155' }}>{item}</Text>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                {foundationState.status === 'loading' ? (
                  <Col span={24}>
                    <Card
                      title="基础样本概览"
                      bordered={false}
                      style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
                    >
                      <Space size={12}>
                        <Spin size="small" />
                        <Text>正在读取本地样本概览...</Text>
                      </Space>
                    </Card>
                  </Col>
                ) : null}

                {foundationState.status === 'error' ? (
                  <Col span={24}>
                    <Card
                      title="基础样本概览"
                      bordered={false}
                      style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
                    >
                      <Alert
                        type="warning"
                        showIcon
                        message="基础样本概览暂时不可用"
                        description={foundationState.message}
                      />
                    </Card>
                  </Col>
                ) : null}

                {foundationState.status === 'success' ? (
                  <>
                    {foundationStats.length ? (
                      foundationStats.map((item) => (
                        <Col xs={12} md={8} xl={4} key={item.label}>
                          <Card
                            bordered={false}
                            style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
                          >
                            <Statistic title={item.label} value={item.value} valueStyle={{ fontSize: 28 }} />
                          </Card>
                        </Col>
                      ))
                    ) : (
                      <Col span={24}>
                        <Card
                          title="基础样本概览"
                          bordered={false}
                          style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
                        >
                          <Alert
                            type={foundationState.data.mode === 'local-db' ? 'warning' : 'info'}
                            showIcon
                            message="基础样本还没就绪"
                            description={foundationState.data.message ?? '当前还没有可读取的本地样本数据。'}
                          />
                          {foundationState.data.missingCoreTables.length ? (
                            <Space wrap size={[8, 8]} style={{ marginTop: 16 }}>
                              {foundationState.data.missingCoreTables.map((table) => (
                                <Tag key={table} color="warning" style={{ marginInlineEnd: 0 }}>
                                  {table}
                                </Tag>
                              ))}
                            </Space>
                          ) : null}
                        </Card>
                      </Col>
                    )}

                    <Col span={24}>
                      <Card
                        title="样本账号预览"
                        bordered={false}
                        style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
                      >
                        {foundationState.data.sampleUsers.length ? (
                          <List
                            dataSource={foundationState.data.sampleUsers}
                            renderItem={(item) => (
                              <List.Item style={{ paddingInline: 0 }}>
                                <div style={{ width: '100%' }}>
                                  <Space wrap size={[8, 8]} style={{ marginBottom: 6 }}>
                                    <Text strong>{item.realName || item.accountNo}</Text>
                                    <Tag color="default" style={{ marginInlineEnd: 0 }}>
                                      {item.accountNo}
                                    </Tag>
                                    {item.roleName ? (
                                      <Tag color="geekblue" style={{ marginInlineEnd: 0 }}>
                                        {item.roleName}
                                      </Tag>
                                    ) : null}
                                    <Tag
                                      color={item.status === 1 ? 'success' : 'default'}
                                      style={{ marginInlineEnd: 0 }}
                                    >
                                      {item.status === 1 ? '启用' : '未启用'}
                                    </Tag>
                                    <Tag
                                      color={
                                        item.bindingStatus === 'PROJECT_BOUND'
                                          ? 'success'
                                          : item.bindingStatus === 'ACCOUNT_ONLY'
                                            ? 'warning'
                                            : 'default'
                                      }
                                      style={{ marginInlineEnd: 0 }}
                                    >
                                      {item.bindingStatus === 'PROJECT_BOUND'
                                        ? 'Noon 已完整绑定'
                                        : item.bindingStatus === 'ACCOUNT_ONLY'
                                          ? '仅账号绑定'
                                          : '未绑定'}
                                    </Tag>
                                  </Space>
                                  <Paragraph style={{ margin: 0, color: '#475569' }}>
                                    {item.companyName || '未填写公司'} · 店铺 {item.storeCount ?? 0} / 已授权{' '}
                                    {item.authorizedStoreCount ?? 0}
                                    {item.sites ? ` · 站点 ${item.sites}` : ''}
                                  </Paragraph>
                                </div>
                              </List.Item>
                            )}
                          />
                        ) : (
                          <Paragraph style={{ margin: 0, color: '#64748b' }}>
                            当前还没有可展示的样本账号。等本地库初始化完成后，这里会直接显示用户、角色和店铺挂载情况。
                          </Paragraph>
                        )}
                      </Card>
                    </Col>
                  </>
                ) : null}
              </Row>

              <Row gutter={[16, 16]}>
                {moduleCards.map((item) => (
                  <Col xs={24} md={12} xl={8} key={item.key}>
                    <Card
                      bordered={false}
                      style={{ height: '100%', boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
                    >
                      <Space direction="vertical" size={10}>
                        <Tag color="geekblue" style={{ width: 'fit-content', marginInlineEnd: 0 }}>
                          下一批主链路
                        </Tag>
                        <Text strong style={{ fontSize: 18, color: '#0f172a' }}>
                          {item.title}
                        </Text>
                        <Paragraph style={{ margin: 0, color: '#475569' }}>
                          {item.desc}
                        </Paragraph>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>

              <Card
                title="接下来就做这些"
                bordered={false}
                style={{ marginTop: 16, boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
              >
                <List
                  dataSource={nextActions}
                  renderItem={(item) => (
                    <List.Item style={{ paddingInline: 0 }}>
                      <Text style={{ color: '#334155' }}>{item}</Text>
                    </List.Item>
                  )}
                />
              </Card>
            </div>
          </Content>
        </Layout>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
