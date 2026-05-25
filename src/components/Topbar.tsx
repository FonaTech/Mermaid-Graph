import {
  Code2,
  Download,
  FileCode2,
  ImageDown,
  Moon,
  PanelRightOpen,
  Save,
  SunMedium,
  Waypoints,
} from 'lucide-react';
import type { DiagramKind, EditorSettings } from '../types';

interface TopbarProps {
  projectName: string;
  kind: DiagramKind;
  mode: 'code' | 'visual';
  settings: EditorSettings;
  saveState: 'saved' | 'saving' | 'dirty';
  onNameChange: (value: string) => void;
  onModeChange: (mode: 'code' | 'visual') => void;
  onThemeChange: (theme: EditorSettings['theme']) => void;
  onExportCode: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
}

export function Topbar({
  projectName,
  kind,
  mode,
  settings,
  saveState,
  onNameChange,
  onModeChange,
  onThemeChange,
  onExportCode,
  onExportSvg,
  onExportPng,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="title-edit">
        <input
          value={projectName}
          onChange={(event) => onNameChange(event.target.value)}
          aria-label="项目名称"
        />
        <span>{kind}</span>
      </div>

      <div className="toolbar-group segmented">
        <button className={mode === 'code' ? 'is-selected' : ''} onClick={() => onModeChange('code')}>
          <Code2 size={16} />
          代码
        </button>
        <button
          className={mode === 'visual' ? 'is-selected' : ''}
          onClick={() => onModeChange('visual')}
        >
          <Waypoints size={16} />
          图形
        </button>
      </div>

      <div className="toolbar-group segmented compact">
        <button
          title="浅色"
          className={settings.theme === 'light' ? 'is-selected' : ''}
          onClick={() => onThemeChange('light')}
        >
          <SunMedium size={16} />
        </button>
        <button
          title="纸张"
          className={settings.theme === 'paper' ? 'is-selected' : ''}
          onClick={() => onThemeChange('paper')}
        >
          <PanelRightOpen size={16} />
        </button>
        <button
          title="深色"
          className={settings.theme === 'dark' ? 'is-selected' : ''}
          onClick={() => onThemeChange('dark')}
        >
          <Moon size={16} />
        </button>
      </div>

      <div className="toolbar-group export-group">
        <button onClick={onExportCode}>
          <FileCode2 size={16} />
          代码
        </button>
        <button onClick={onExportSvg}>
          <Download size={16} />
          SVG
        </button>
        <button onClick={onExportPng}>
          <ImageDown size={16} />
          PNG
        </button>
      </div>

      <span className={`save-state ${saveState}`}>
        <Save size={15} />
        {saveState === 'saved' ? '已保存' : saveState === 'saving' ? '保存中' : '未保存'}
      </span>
    </header>
  );
}
