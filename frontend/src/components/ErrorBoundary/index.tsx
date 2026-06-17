import React from 'react';

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
    console.error('ErrorBoundary caught:', error, errorInfo);
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
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            页面出错了
          </h2>
          <p style={{ color: 'var(--fg3)', marginBottom: '16px' }}>
            {this.state.error?.message || '未知错误'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '8px 24px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
