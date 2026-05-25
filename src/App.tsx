import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CodeEditor } from './components/CodeEditor';
import { MermaidPreview } from './components/MermaidPreview';
import { ProjectSidebar } from './components/ProjectSidebar';
import { Topbar } from './components/Topbar';
import { VisualEditor } from './components/VisualEditor';
import { cleanFilename, exportPng, exportSvg, downloadText } from './lib/export';
import { detectDiagramKind } from './lib/mermaid';
import { SAMPLE_PROJECT } from './lib/sample';
import {
  DEFAULT_SETTINGS,
  listProjects,
  loadSettings,
  removeProject,
  saveSettings,
  upsertProject,
} from './lib/storage';
import type { EditorSettings, MermaidProject } from './types';
import './styles.css';

type SaveState = 'saved' | 'saving' | 'dirty';

function createProject(name = 'Untitled Diagram', code = 'graph TD\n    A[Start] --> B[Edit me]') {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    code,
    kind: detectDiagramKind(code),
    updatedAt: now,
  } satisfies MermaidProject;
}

export default function App() {
  const [projects, setProjects] = useState<MermaidProject[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [activeProject, setActiveProject] = useState<MermaidProject>();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'code' | 'visual'>('code');
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [svg, setSvg] = useState('');
  const exportRef = useRef<HTMLDivElement | null>(null);

  const refreshProjects = useCallback(async () => {
    const items = await listProjects();
    setProjects(items);
    return items;
  }, []);

  useEffect(() => {
    async function boot() {
      const [storedSettings, storedProjects] = await Promise.all([loadSettings(), listProjects()]);
      setSettings(storedSettings);
      if (!storedProjects.length) {
        await upsertProject(SAMPLE_PROJECT);
        setProjects([SAMPLE_PROJECT]);
        setActiveId(SAMPLE_PROJECT.id);
        setActiveProject(SAMPLE_PROJECT);
        return;
      }
      setProjects(storedProjects);
      setActiveId(storedProjects[0].id);
      setActiveProject(storedProjects[0]);
    }
    void boot();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const project = projects.find((item) => item.id === activeId);
    if (project) setActiveProject(project);
  }, [activeId, projects]);

  useEffect(() => {
    if (!activeProject) return;
    setSaveState('dirty');
    const timeout = window.setTimeout(async () => {
      setSaveState('saving');
      const next = { ...activeProject, kind: detectDiagramKind(activeProject.code), updatedAt: Date.now() };
      await upsertProject(next);
      setProjects((items) => items.map((item) => (item.id === next.id ? next : item)));
      setActiveProject(next);
      setSaveState('saved');
    }, 520);
    return () => window.clearTimeout(timeout);
  }, [activeProject?.code, activeProject?.name]);

  const filteredProjects = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return projects;
    return projects.filter((project) => project.name.toLowerCase().includes(lower));
  }, [projects, query]);

  const updateProject = (patch: Partial<MermaidProject>) => {
    setActiveProject((project) => {
      if (!project) return project;
      return { ...project, ...patch, kind: patch.code ? detectDiagramKind(patch.code) : project.kind };
    });
  };

  const handleCreate = async () => {
    const project = createProject();
    await upsertProject(project);
    await refreshProjects();
    setActiveId(project.id);
    setActiveProject(project);
    setMode('code');
  };

  const handleDuplicate = async (id: string) => {
    const source = projects.find((project) => project.id === id);
    if (!source) return;
    const project = {
      ...source,
      id: crypto.randomUUID(),
      name: `${source.name} Copy`,
      updatedAt: Date.now(),
    };
    await upsertProject(project);
    await refreshProjects();
    setActiveId(project.id);
    setActiveProject(project);
  };

  const handleDelete = async (id: string) => {
    if (projects.length <= 1) {
      const replacement = createProject('Untitled Diagram');
      await removeProject(id);
      await upsertProject(replacement);
      await refreshProjects();
      setActiveId(replacement.id);
      setActiveProject(replacement);
      return;
    }
    await removeProject(id);
    const items = await refreshProjects();
    if (id === activeId) {
      setActiveId(items[0]?.id);
      setActiveProject(items[0]);
    }
  };

  const handleThemeChange = async (theme: EditorSettings['theme']) => {
    const next = { ...settings, theme };
    setSettings(next);
    await saveSettings(next);
  };

  const filename = cleanFilename(activeProject?.name ?? 'mermaid-diagram');

  const handleExportCode = () => {
    if (!activeProject) return;
    downloadText(`${filename}.mmd`, activeProject.code);
  };

  const handleExportSvg = () => {
    if (!svg) return;
    exportSvg(`${filename}.svg`, svg);
  };

  const handleExportPng = async () => {
    if (!exportRef.current) return;
    await exportPng(`${filename}.png`, exportRef.current);
  };

  if (!activeProject) {
    return <div className="app-loading">Loading Mermaid Studio...</div>;
  }

  const isFlowchart = activeProject.kind === 'flowchart';

  return (
    <div className={`app theme-${settings.theme}`}>
      <ProjectSidebar
        projects={filteredProjects}
        activeId={activeId}
        query={query}
        onQueryChange={setQuery}
        onSelect={(id) => {
          setActiveId(id);
          setMode('code');
        }}
        onCreate={handleCreate}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />

      <main className="workspace">
        <Topbar
          projectName={activeProject.name}
          kind={activeProject.kind}
          mode={mode}
          settings={settings}
          saveState={saveState}
          onNameChange={(name) => updateProject({ name })}
          onModeChange={setMode}
          onThemeChange={handleThemeChange}
          onExportCode={handleExportCode}
          onExportSvg={handleExportSvg}
          onExportPng={handleExportPng}
        />

        <div className="editor-grid">
          <MermaidPreview
            code={activeProject.code}
            settings={settings}
            onSvgChange={setSvg}
            exportRef={exportRef}
          />

          <aside className="right-panel">
            {mode === 'code' ? (
              <CodeEditor
                value={activeProject.code}
                onChange={(code) => updateProject({ code })}
                theme={settings.theme}
              />
            ) : (
              <VisualEditor
                code={activeProject.code}
                onCodeChange={(code) => updateProject({ code })}
                readOnly={!isFlowchart}
              />
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
