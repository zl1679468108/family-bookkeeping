import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles/globals.scss';
import { NotificationProvider } from './utils/notifications';
import { queryClient } from './utils/queryClient';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// ── 开发环境：清理 webpack-dev-server overlay 残留 iframe ──
if (import.meta.env.DEV) {
  const overlayIframe = document.getElementById('webpack-dev-server-client-overlay')
  if (overlayIframe) {
    overlayIframe.style.pointerEvents = 'none'
    overlayIframe.remove()
  }
}

// ── 开发环境：过滤 HMR removeChild 噪音 ──
if (import.meta.env.DEV) {
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    const msg = args[0]
    if (typeof msg === 'string' && msg.includes('removeChild')) return
    originalError.apply(console, args)
  }
}

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
