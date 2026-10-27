export function download(content, type, filename) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export const fileStamp = () => new Date().toISOString().replace(/[:.]/g, '-');
export const exportJSON = (data, filename) =>
  download(JSON.stringify(data, null, 2), 'application/json;charset=utf-8', filename);
export const exportText = (text, filename) =>
  download('\ufeff' + text, 'text/plain;charset=utf-8', filename);
export async function readImportFile(file) {
  if (file.size > 8 * 1024 * 1024) throw new Error('文件超过8MB，请分开导入。');
  return file.text();
}
