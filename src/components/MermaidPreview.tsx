import { AlertTriangle, Maximize2, Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { renderMermaid } from '../lib/mermaid';
import type { EditorSettings } from '../types';

interface MermaidPreviewProps {
  code: string;
  settings: EditorSettings;
  onSvgChange: (svg: string) => void;
  exportRef: React.RefObject<HTMLDivElement | null>;
}

export function MermaidPreview({ code, settings, onSvgChange, exportRef }: MermaidPreviewProps) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [scale, setScale] = useState(settings.previewScale);
  const renderId = useMemo(() => Math.random().toString(36).slice(2), []);
  const lastCodeRef = useRef('');

  useEffect(() => {
    let isCurrent = true;
    const timeout = window.setTimeout(async () => {
      try {
        if (lastCodeRef.current === code) return;
        lastCodeRef.current = code;
        const output = await renderMermaid(code, `${renderId}-${Date.now()}`);
        if (!isCurrent) return;
        setSvg(output);
        setError('');
        onSvgChange(output);
      } catch (caught) {
        if (!isCurrent) return;
        const message = caught instanceof Error ? caught.message : String(caught);
        setError(message);
      }
    }, 260);
    return () => {
      isCurrent = false;
      window.clearTimeout(timeout);
    };
  }, [code, onSvgChange, renderId]);

  return (
    <section className={`preview-shell ${settings.theme}`}>
      <div className="preview-toolbar">
        <span>Live Preview</span>
        <div>
          <button title="缩小" onClick={() => setScale((value) => Math.max(0.45, value - 0.1))}>
            <Minus size={15} />
          </button>
          <strong>{Math.round(scale * 100)}%</strong>
          <button title="放大" onClick={() => setScale((value) => Math.min(2.4, value + 0.1))}>
            <Plus size={15} />
          </button>
          <button title="适配" onClick={() => setScale(1)}>
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      <div className="preview-stage">
        {error ? (
          <div className="render-error">
            <AlertTriangle size={20} />
            <strong>Mermaid 解析失败</strong>
            <pre>{error}</pre>
          </div>
        ) : (
          <div className="preview-export-surface" ref={exportRef}>
            <div
              className="preview-render"
              style={{ transform: `scale(${scale})` }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
