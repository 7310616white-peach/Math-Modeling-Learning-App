import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.jsx';
import './styles.css';

class AppBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="fatal">
          <h1>这一页暂时没有打开</h1>
          <p>本机学习库未清空。请重新打开 App；若有未保存输入，先保留当前页面。</p>
          <button onClick={() => location.reload()}>重新打开</button>
        </main>
      );
    return this.props.children;
  }
}
createRoot(document.getElementById('root')).render(
  <AppBoundary>
    <App />
  </AppBoundary>,
);
if (import.meta.env.PROD && location.protocol !== 'file:') {
  if ('serviceWorker' in navigator)
    navigator.serviceWorker
      .register(new URL('./sw.js', document.baseURI))
      .then(() => navigator.serviceWorker.ready)
      .then(() => window.dispatchEvent(new Event('math:offline-ready')))
      .catch(() => {
        /* Keep offline readiness unconfirmed if caching fails. */
      });
}
