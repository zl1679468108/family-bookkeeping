import React from 'react';
import { Button } from '../ui/Button';
import { ERROR_UNKNOWN } from '../../utils/errorCopy';
import { reportClientError } from '../../utils/clientDiagnostics';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    reportClientError('ErrorBoundary.componentDidCatch', { error, errorInfo });
  }

  // 路由切换（children 变化）后重置错误状态，允许新组件重新尝试渲染
  componentDidUpdate(prevProps: Props) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😵</div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--fg)' }}>
            页面出错了
          </h2>
          <p style={{ color: 'var(--fg3)', marginBottom: '16px' }}>
            {this.state.error?.message || ERROR_UNKNOWN}
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            重试
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
