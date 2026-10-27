import { useCallback, useEffect, useRef, useState } from 'react';
import { builtInCourses } from '../domain/course.js';
import { useWorkspace } from './useWorkspace.js';
import { Dashboard } from '../features/Dashboard.jsx';
import { Lesson } from '../features/Lesson.jsx';
import { Courses } from '../features/Courses.jsx';
import { Records } from '../features/Records.jsx';
import { Profile } from '../features/Profile.jsx';
import { CopyDialog, Icon } from '../features/Common.jsx';
import { backHandlers } from '../platform/navigation.js';
import { isNativeApp } from '../platform/files.js';

const pages = [
  ['home', '学习台'],
  ['courses', '30天课程'],
  ['records', '学习记录'],
  ['profile', '我的'],
];
const readRoute = () => {
  const [page = 'home', id, section] = location.hash.replace(/^#\/?/, '').split('/');
  return {
    page: ['home', 'courses', 'records', 'profile', 'learn'].includes(page) ? page : 'home',
    id,
    section,
  };
};
export function App() {
  const { state, error, refresh } = useWorkspace();
  const [route, setRoute] = useState(readRoute);
  const routeRef = useRef(route);
  const [toast, setToast] = useState(null);
  const [copyValue, setCopyValue] = useState(null);
  const [offlineReady, setOfflineReady] = useState(false);
  const [installEvent, setInstallEvent] = useState(null);
  const guard = useRef(null);
  const scrollPositions = useRef(new Map());
  const main = useRef(null);
  const notify = useCallback((message, error = false) => setToast({ message, error }), []);
  useEffect(() => {
    const ready = () => setOfflineReady(true);
    const install = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener('math:offline-ready', ready);
    window.addEventListener('beforeinstallprompt', install);
    if (navigator.serviceWorker && location.protocol !== 'file:' && !isNativeApp())
      navigator.serviceWorker.ready.then(() => setOfflineReady(true));
    return () => {
      window.removeEventListener('math:offline-ready', ready);
      window.removeEventListener('beforeinstallprompt', install);
    };
  }, []);
  useEffect(() => {
    const handler = async () => {
      const target = readRoute();
      try {
        if (guard.current) await guard.current();
        await refresh();
      } catch {
        history.replaceState(
          null,
          '',
          `#/${routeRef.current.page}/${routeRef.current.id || ''}/${routeRef.current.section || ''}`,
        );
        notify('草稿还没成功保存，当前输入已保留。请重试保存或导出后再离开。', true);
        return;
      }
      const previous = routeRef.current;
      scrollPositions.current.set(
        [previous.page, previous.id, previous.section].join('/'),
        window.scrollY,
      );
      routeRef.current = target;
      setRoute(target);
      setToast(null);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, [refresh, notify]);
  useEffect(() => {
    const key = [route.page, route.id, route.section].join('/');
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositions.current.get(key) || 0);
      main.current?.focus({ preventScroll: true });
    });
    document.title =
      (route.page === 'learn' ? '课堂' : pages.find(([id]) => id === route.page)?.[1] || '知数') +
      ' · 知数';
  }, [route]);
  const navigate = async (page, id = '', section = '') => {
    try {
      if (guard.current) await guard.current();
    } catch {
      return notify('草稿尚未保存。请重试保存或先导出作答，当前输入会保留。', true);
    }
    location.hash = `/${page}/${id}/${section}`;
  };
  useEffect(() => {
    if (route.page === 'home') return;
    return backHandlers.add(async () => {
      await navigate(route.page === 'records' && route.id ? 'records' : 'home');
    });
  }, [route.page, route.id, route.section]);
  useEffect(() => {
    const fail = () => notify('返回操作未完成，当前输入仍在页面。请先保存或导出。', true);
    window.addEventListener('math:native-navigation-error', fail);
    return () => window.removeEventListener('math:native-navigation-error', fail);
  }, [notify]);
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      notify('已复制，请回到聊天粘贴；没有自动发送。');
    } catch {
      setCopyValue(text);
    }
  };
  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    notify(
      choice.outcome === 'accepted'
        ? '已请求安装，请在设备中确认。'
        : '已取消安装，仍可在浏览器学习。',
    );
    setInstallEvent(null);
  }
  const allCourses = [
    ...builtInCourses,
    ...(state?.courses || []).filter((c) => !builtInCourses.some((b) => b.id === c.id)),
  ].sort((a, b) => a.day - b.day);
  const active = allCourses.find((c) => c.id === route.id);
  const page = route.page === 'learn' ? 'home' : route.page;
  const nav = (mobile = false) => (
    <nav aria-label={mobile ? '手机主导航' : '主导航'}>
      {pages.map(([id, title]) => (
        <button
          key={id}
          aria-current={page === id ? 'page' : undefined}
          onClick={() => navigate(id)}
        >
          <span className={'nav-icon ' + (id === 'home' ? 'home-icon' : '')}>
            <Icon name={id} />
          </span>
          <span>{title}</span>
        </button>
      ))}
    </nav>
  );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <aside className="sidebar">
        <button className="brand" onClick={() => navigate('home')}>
          <span className="brand-symbol">
            ∑<i />
          </span>
          <span>
            知数<small>MATH POCKET</small>
          </span>
        </button>
        <p className="sidebar-caption">每天一点，慢慢学明白。</p>
        {nav()}
        <div className="local-note">
          <span className="status-dot" />
          本地学习空间<small>无需登录 · 自己的节奏</small>
          <span className="preview-label">0.1 预览版</span>
        </div>
      </aside>
      <main ref={main} id="main-content" tabIndex={-1}>
        <header className="topbar">
          <span>{route.page === 'learn' ? '课堂' : pages.find(([id]) => id === page)?.[1]}</span>
          <span>
            <span className="status-dot" />
            {isNativeApp() ? '离线 App' : offlineReady ? '离线就绪' : '本机保存'}
            <b className="top-version">第一版预览</b>
          </span>
        </header>
        <div className="main-content">
          {toast && (
            <div
              className={'toast ' + (toast.error ? 'error' : '')}
              role={toast.error ? 'alert' : 'status'}
            >
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)} aria-label="关闭提示">
                ×
              </button>
            </div>
          )}
          {!state ? (
            <section className="card loading-state">
              <h1>{error ? '学习库暂时无法打开' : '正在打开你的学习空间…'}</h1>
              <p>{error || '课程和作答仅保存在本机。'}</p>
              {error && (
                <button
                  className="primary"
                  onClick={() =>
                    refresh().catch(() => notify('仍未能打开存储，请换用普通浏览窗口。', true))
                  }
                >
                  重试打开
                </button>
              )}
            </section>
          ) : (
            <>
              {route.page === 'home' && (
                <Dashboard
                  state={state}
                  courses={allCourses}
                  onOpen={(id, section) => navigate('learn', id, section)}
                  onNavigate={navigate}
                />
              )}
              {route.page === 'courses' && (
                <Courses
                  state={state}
                  courses={allCourses}
                  onOpen={(id, section) => navigate('learn', id, section)}
                  onNavigate={navigate}
                />
              )}
              {route.page === 'learn' &&
                (active ? (
                  <Lesson
                    key={active.id}
                    course={active}
                    sectionId={route.section}
                    initial={state.drafts.find((d) => d.courseId === active.id)}
                    guard={guard}
                    onOpen={(id, section) => navigate('learn', id, section)}
                    onNavigate={navigate}
                    onSaved={async (a) => {
                      await refresh();
                      await navigate('records', a.id);
                    }}
                    onCopy={copy}
                    notify={notify}
                  />
                ) : (
                  <section className="card">
                    <h1>这份课程还没准备好</h1>
                    <button onClick={() => navigate('courses')}>回到课程目录</button>
                  </section>
                ))}
              {route.page === 'records' && (
                <Records
                  state={state}
                  courses={allCourses}
                  selectedId={route.id}
                  onSelect={(id) => navigate('records', id || '')}
                  onOpen={(id, section) => navigate('learn', id, section)}
                  onCopy={copy}
                  onRefresh={refresh}
                  notify={notify}
                />
              )}
              {route.page === 'profile' && (
                <Profile
                  state={state}
                  courses={allCourses}
                  onRefresh={refresh}
                  onCopy={copy}
                  notify={notify}
                  offlineReady={offlineReady}
                  installEvent={installEvent}
                  onInstall={install}
                />
              )}
            </>
          )}
          <footer className="app-footer">
            知数 · 2026 数维杯轻量备赛<span>本地学习，不赶进度。</span>
          </footer>
        </div>
      </main>
      <div className="mobile-nav">{nav(true)}</div>
      {copyValue !== null && <CopyDialog value={copyValue} onClose={() => setCopyValue(null)} />}
    </div>
  );
}
