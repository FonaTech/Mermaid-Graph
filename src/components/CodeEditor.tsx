import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme: 'light' | 'dark' | 'paper';
}

export function CodeEditor({ value, onChange, theme }: CodeEditorProps) {
  return (
    <div className="code-editor">
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={value}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        onChange={(next) => onChange(next ?? '')}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineHeight: 22,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
}
