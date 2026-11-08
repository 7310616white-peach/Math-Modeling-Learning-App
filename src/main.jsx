import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.jsx';
import './styles.css';
import { download, isNativeApp } from './platform/files.js';
import { backHandlers, startNativeNavigation } from './platform/navigation.js';

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
const sprintPage = document.body.hasAttribute('data-sprint-app');
const native = isNativeApp();
if (sprintPage && native) {
  window.mathSprintDownload = download;
  document.getElementById('classic-link').hidden = false;
  const dialog = document.getElementById('text-dialog');
  const backToHome = () => {
    if (dialog.open) {
      document.getElementById('close-dialog').click();
    } else if (window.mathSprintCanLeave()) {
      document.getElementById('home').scrollIntoView();
    }
  };
  let removeBack;
  const syncBack = () => {
    const enabled = dialog.open || window.scrollY > 48 || window.mathSprintHasUnsavedChanges();
    if (enabled && !removeBack) removeBack = backHandlers.add(backToHome);
    if (!enabled && removeBack) {
      removeBack();
      removeBack = undefined;
    }
  };
  window.addEventListener('scroll', syncBack, { passive: true });
  document.addEventListener('input', syncBack);
  new MutationObserver(syncBack).observe(dialog, { attributeFilter: ['open'] });
  syncBack();
} else if (!sprintPage) {
  if (native && new URLSearchParams(location.search).get('classic') !== '1') {
    location.replace(new URL('./sprint.html', document.baseURI));
  } else {
    createRoot(document.getElementById('root')).render(
      <AppBoundary>
        <App />
      </AppBoundary>,
    );
  }
}
if (native) {
  startNativeNavigation().catch(() =>
    window.dispatchEvent(new Event('math:native-navigation-error')),
  );
}
if (import.meta.env.PROD && location.protocol !== 'file:' && !isNativeApp()) {
  if ('serviceWorker' in navigator)
    navigator.serviceWorker
      .register(new URL('./sw.js', document.baseURI))
      .then(() => navigator.serviceWorker.ready)
      .then(() => window.dispatchEvent(new Event('math:offline-ready')))
      .catch(() => {
        /* Keep offline readiness unconfirmed if caching fails. */
      });
}
