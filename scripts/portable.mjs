import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist');
let html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g)];
for (const match of scripts) {
  const source = await fs.readFile(path.join(root, match[1]), 'utf8');
  html = html.replace(
    match[0],
    () => `<script type="module">${source.replace(/<\/script/gi, '<\\/script')}</script>`,
  );
}
const styles = [...html.matchAll(/<link[^>]*href="([^"]+\.css)"[^>]*>/g)];
for (const match of styles) {
  const style = await fs.readFile(path.join(root, match[1]), 'utf8');
  html = html.replace(match[0], () => `<style>${style}</style>`);
}
html = html.replace(/<link[^>]*rel="(?:manifest|modulepreload|apple-touch-icon)"[^>]*>/g, '');
const icon = Buffer.from(await fs.readFile(path.join(root, 'icon.svg'))).toString('base64');
html = html.replace(/href="\.\/icon\.svg"/g, `href="data:image/svg+xml;base64,${icon}"`);
const notices = (await fs.readFile('THIRD_PARTY_NOTICES.md', 'utf8'))
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
html = html.replace(
  '</body>',
  () => `<template id="third-party-notices"><pre>${notices}</pre></template></body>`,
);
await fs.writeFile(path.join(root, '知数-数学建模App-预览.html'), html);
console.log('已生成可直接打开的离线 App 预览文件。');
