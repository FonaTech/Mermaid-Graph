import { toPng } from 'html-to-image';

export function downloadText(filename: string, content: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  downloadBlob(filename, blob);
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function cleanFilename(name: string): string {
  return name
    .trim()
    .replace(/[^\w\u4e00-\u9fffµ.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'mermaid-diagram';
}

export function exportSvg(filename: string, svg: string) {
  downloadText(filename, svg, 'image/svg+xml;charset=utf-8');
}

export async function exportPng(filename: string, element: HTMLElement) {
  const dataUrl = await toPng(element, {
    pixelRatio: 3,
    backgroundColor: '#ffffff',
    cacheBust: true,
  });
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  downloadBlob(filename, blob);
}
