import { Alert, Button, Carousel, ConfigProvider, Form, Input } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { useEffect, useMemo, useState } from 'react';
import { currentAppPathname, withPublicBasePath } from '../../runtimePaths';

export type EmailCodeLoginFormValues = {
  email: string;
  code: string;
};

type AuthView = 'login';

type Props = {
  codeCooldownSeconds: number;
  codeRequesting: boolean;
  errorMessage?: string | null;
  form: FormInstance<EmailCodeLoginFormValues>;
  submitting: boolean;
  onInputChange?: () => void;
  onRequestCode: () => void;
  onSubmit: () => void;
};

const LEGACY_LOGIN_PRIMARY = '#5E3CDE';

const carouselStyles = `
  .replica-login-dots {
    bottom: 20px !important;
  }
  .replica-login-dots li button {
    background: rgba(255, 255, 255, 0.6) !important;
    border-radius: 50% !important;
    width: 8px !important;
    height: 8px !important;
  }
  .replica-login-dots li.slick-active button {
    background: rgba(255, 255, 255, 1) !important;
  }
`;

function normalizeAuthView(pathname: string): AuthView {
  void pathname;
  return 'login';
}

function HeaderTitle({ authView }: { authView: AuthView }) {
  const title = authView === 'login' ? '欢迎登录' : '欢迎登录';
  return (
    <div>
      <div style={{ color: '#433F4F', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>{title}</div>
    </div>
  );
}

function LoginContent({
  codeCooldownSeconds,
  codeRequesting,
  errorMessage,
  form,
  onInputChange,
  onRequestCode,
  submitting,
  onSubmit
}: {
  codeCooldownSeconds: number;
  codeRequesting: boolean;
  errorMessage?: string | null;
  form: FormInstance<EmailCodeLoginFormValues>;
  onInputChange?: () => void;
  onRequestCode: () => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const codeButtonDisabled = codeRequesting || codeCooldownSeconds > 0;
  return (
    <div style={{ marginTop: 96 }}>
      <Form
        data-testid="login-form"
        form={form}
        labelCol={{ span: 4 }}
        preserve={false}
        onFinish={onSubmit}
        onValuesChange={onInputChange}
      >
        {errorMessage ? (
          <Form.Item style={{ marginBottom: 16 }}>
            <Alert data-testid="login-error-alert" type="error" showIcon message={errorMessage} />
          </Form.Item>
        ) : null}
        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效邮箱' }
          ]}
        >
          <Input data-testid="login-email-input" autoComplete="email" placeholder="请输入邮箱" size="large" />
        </Form.Item>

        <Form.Item label="验证码" required style={{ marginBottom: 25 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Form.Item name="code" noStyle rules={[{ required: true, message: '请输入验证码' }]}>
              <Input data-testid="login-code-input" autoComplete="one-time-code" placeholder="请输入验证码" size="large" />
            </Form.Item>
            <Button
              data-testid="login-code-request-button"
              disabled={codeButtonDisabled}
              htmlType="button"
              loading={codeRequesting}
              size="large"
              style={{ flex: '0 0 128px' }}
              type="primary"
              onClick={onRequestCode}
            >
              {codeCooldownSeconds > 0 ? `${codeCooldownSeconds}s` : '获取验证码'}
            </Button>
          </div>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button data-testid="login-submit-button" block htmlType="submit" shape="round" size="large" type="primary" loading={submitting}>
            登录
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export function ReplicaLoginPage({
  codeCooldownSeconds,
  codeRequesting,
  errorMessage,
  form,
  submitting,
  onInputChange,
  onRequestCode,
  onSubmit
}: Props) {
  const [authView, setAuthView] = useState<AuthView>(() =>
    typeof window === 'undefined' ? 'login' : normalizeAuthView(currentAppPathname())
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (currentAppPathname() === '/') {
      window.history.replaceState({}, '', '/login');
      setAuthView('login');
    }

    const sync = () => setAuthView(normalizeAuthView(currentAppPathname()));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const rightContent = useMemo(() => {
    return (
      <LoginContent
        codeCooldownSeconds={codeCooldownSeconds}
        codeRequesting={codeRequesting}
        errorMessage={errorMessage}
        form={form}
        onInputChange={onInputChange}
        onRequestCode={onRequestCode}
        submitting={submitting}
        onSubmit={onSubmit}
      />
    );
  }, [codeCooldownSeconds, codeRequesting, errorMessage, form, onInputChange, onRequestCode, onSubmit, submitting]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: LEGACY_LOGIN_PRIMARY
        }
      }}
    >
      <div
        data-testid={`auth-page-${authView}`}
        style={{
          minHeight: '100vh',
          backgroundImage: `url(${withPublicBasePath('/auth/login-bg.png')})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#01010133'
          }}
        />

        <style>{carouselStyles}</style>

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
        >
          <div
            style={{
              width: 1300,
              maxWidth: '100%',
              display: 'flex',
              gap: 40,
              alignItems: 'stretch'
            }}
          >
            <div style={{ flex: '0 0 720px', minWidth: 0 }}>
              <Carousel
                autoplay
                effect="fade"
                dots={{ className: 'replica-login-dots' }}
                style={{ borderRadius: 24, overflow: 'hidden' }}
              >
                <div>
                  <div
                    style={{
                      height: 520,
                      backgroundImage: `url(${withPublicBasePath('/auth/banner-1.jpg')})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                </div>
              </Carousel>
            </div>

            <div
              style={{
                flex: '0 0 520px',
                padding: 32,
                background: 'rgba(251,249,255,0.88)',
                border: '1px solid #D5D2E0',
                borderRadius: 15,
                boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <HeaderTitle authView={authView} />
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img alt="logo" src={withPublicBasePath('/logo-title.png')} style={{ height: 32 }} />
                </div>
              </div>

              {rightContent}
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            zIndex: 3,
            bottom: 16,
            width: '100%',
            textAlign: 'center'
          }}
        >
          <a
            href="https://beian.miit.gov.cn"
            rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14 }}
            target="_blank"
          >
            浙ICP备2025165687号-1
          </a>
        </div>
      </div>
    </ConfigProvider>
  );
}
