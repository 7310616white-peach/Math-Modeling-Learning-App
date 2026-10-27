import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const isNativeApp = () => Capacitor.isNativePlatform();
export async function download(content, type, filename) {
  if (isNativeApp()) {
    const file = await Filesystem.writeFile({
      path: `exports/${filename}`,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    await Share.share({
      title: '保存或分享学习文件',
      files: [file.uri],
      dialogTitle: '请选择保存或分享位置',
    });
    return '已打开系统保存或分享界面，请确认文件已另存到 App 之外。';
  }
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return '已发起下载，请在下载列表确认文件已保存。';
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
