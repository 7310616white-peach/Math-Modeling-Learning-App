import { useEffect, useRef } from 'react';
export function Modal({ titleId, onClose, children }) {
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {children}
    </dialog>
  );
}
export function Icon({ name, ...props }) {
  const paths = {
    home: 'M3 10 12 3l9 7v10H3z M9 20v-7h6v7',
    courses: 'M4 4h7v16H4z M14 4h6v16h-6z',
    records: 'M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h5',
    profile: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',
    arrow: 'M4 12h15 M13 6l6 6-6 6',
    back: 'M20 12H5 M11 6l-6 6 6 6',
    check: 'm5 12 4 4L19 6',
    export: 'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',
    clock: 'M12 7v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.arrow} />
    </svg>
  );
}
export function Badge({ children, tone = '' }) {
  return <span className={'badge ' + tone}>{children}</span>;
}
export function PageHeading({ eyebrow, title, children }) {
  return (
    <div className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="empty card">
      <Icon name="records" />
      <h3>{title}</h3>
      <p className="muted">{children}</p>
    </div>
  );
}
export function Block({ block }) {
  if (block.type === 'table')
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {block.headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i}>
                {row.map((v, j) => (
                  <td key={j}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  if (block.type === 'list')
    return (
      <ol className="lesson-list">
        {block.items.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    );
  return (
    <p className={block.type === 'note' ? 'callout' : block.type === 'formula' ? 'formula' : ''}>
      {block.text}
    </p>
  );
}
export function CopyDialog({ value, onClose }) {
  const field = useRef(null);
  const select = () => {
    field.current?.focus();
    field.current?.select();
  };
  return (
    <Modal titleId="copy-title" onClose={onClose}>
      <h2 id="copy-title">复制到聊天</h2>
      <p className="muted">点击下方文本全选，Mac 按 ⌘C，手机长按复制。这里不会自动发送。</p>
      <textarea
        ref={field}
        readOnly
        value={value}
        aria-label="待复制的内容"
        onFocus={(e) => e.target.select()}
      />
      <div className="button-row">
        <button onClick={select} className="primary">
          全选文本
        </button>
        <button onClick={onClose}>关闭</button>
      </div>
    </Modal>
  );
}
