import { SafetyCertificateOutlined } from '@ant-design/icons';
import { ConfigProvider } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { useEffect, useMemo, useState } from 'react';
import { currentAppPathname } from '../../runtimePaths';
import { NUONO_PRIMARY } from '../../shared/themePalette';
import {
  normalizeAuthView,
  ReplicaAuthHeader,
  ReplicaLoginContent,
  ReplicaRegisterContent,
  ReplicaResetPwdContent,
  type AuthView,
  type LoginFormValues
} from './ReplicaAuthContent';
import { SolarTermPanel } from './SolarTermPanel';
import './replica-login-layout.css';
import './replica-login-solar-art.css';
import './replica-login-responsive.css';

type Props = {
  errorMessage?: string | null;
  form: FormInstance<LoginFormValues>;
  submitting: boolean;
  onInputChange?: () => void;
  onSubmit: () => void;
};

const VIEW_EYEBROW: Record<AuthView, string> = {
  login: '账号登录',
  register: '创建账号',
  'reset-pwd': '找回访问'
};

export function ReplicaLoginPage({ errorMessage, form, submitting, onInputChange, onSubmit }: Props) {
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

  const authContent = useMemo(() => {
    if (authView === 'register') {
      return <ReplicaRegisterContent />;
    }
    if (authView === 'reset-pwd') {
      return <ReplicaResetPwdContent />;
    }
    return (
      <ReplicaLoginContent
        errorMessage={errorMessage}
        form={form}
        onInputChange={onInputChange}
        submitting={submitting}
        onSubmit={onSubmit}
      />
    );
  }, [authView, errorMessage, form, onInputChange, onSubmit, submitting]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: NUONO_PRIMARY,
          borderRadius: 9,
          controlHeightLG: 42
        }
      }}
    >
      <main className="nuono-login-page" data-testid={`auth-page-${authView}`}>
        <section className="nuono-login-auth-panel">
          <div className="nuono-login-brand" aria-label="诺诺管家">
            <span className="nuono-login-brand-mark">诺</span>
            <span>
              <strong>诺诺管家</strong>
              <small>跨境电商运营工作台</small>
            </span>
          </div>

          <div className="nuono-login-auth-main">
            <span className="nuono-login-auth-eyebrow">{VIEW_EYEBROW[authView]}</span>
            <ReplicaAuthHeader authView={authView} />
            {authContent}
            <div className="nuono-login-security">
              <SafetyCertificateOutlined />
              账号信息经安全连接传输
            </div>
          </div>

          <a
            className="nuono-login-record"
            href="https://beian.miit.gov.cn"
            rel="noopener noreferrer"
            target="_blank"
          >
            浙ICP备2025165687号-1
          </a>
        </section>

        <SolarTermPanel />
      </main>
    </ConfigProvider>
  );
}
