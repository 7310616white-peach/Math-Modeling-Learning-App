import { useCallback, useEffect, useRef, useState } from 'react';
import { loadState, saveDraft } from '../data/store.js';
export function useWorkspace() {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    const value = await loadState();
    setState(value);
    setError('');
    return value;
  }, []);
  useEffect(() => {
    refresh().catch(() =>
      setError(
        '无法打开本机学习库。请确认浏览器允许本地存储，或改用普通浏览模式；已有数据不会被清空。',
      ),
    );
  }, [refresh]);
  return { state, error, refresh };
}
export function useDraft(course, initial) {
  const key = course?.id;
  const blank = () =>
    Object.fromEntries(course.questions.map((q) => [q.id, initial?.answers[q.id] || '']));
  const [answers, setAnswers] = useState(blank);
  const [status, setStatus] = useState(initial ? 'saved' : 'idle');
  const [savedAt, setSavedAt] = useState(initial?.updatedAt);
  const answersRef = useRef(answers);
  const queue = useRef(Promise.resolve());
  const dirty = useRef(false);
  const enqueue = useCallback(
    (value) => {
      dirty.current = true;
      setStatus('saving');
      queue.current = queue.current
        .catch(() => {})
        .then(async () => {
          try {
            const record = await saveDraft(course, value);
            if (answersRef.current === value) {
              dirty.current = false;
              setStatus('saved');
              setSavedAt(record.updatedAt);
            }
          } catch (error) {
            if (answersRef.current === value) setStatus('failed');
            throw error;
          }
        });
      // Errors stay on the queue for navigation/submit to observe; attach a handler to avoid unhandled rejections.
      queue.current.catch(() => {});
    },
    [key],
  );
  const change = (id, value) => {
    const next = { ...answersRef.current, [id]: value };
    answersRef.current = next;
    setAnswers(next);
    enqueue(next);
  };
  const flush = async () => {
    await queue.current;
    if (dirty.current)
      throw new Error('草稿尚未保存。请重试保存，或先导出作答；当前页面保留你的输入。');
  };
  useEffect(() => {
    const handler = (e) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);
  return { answers, status, savedAt, change, flush, retry: () => enqueue(answersRef.current) };
}
