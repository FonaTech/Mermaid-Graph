import { Copy, FilePlus2, Search, Trash2 } from 'lucide-react';
import type { MermaidProject } from '../types';

interface ProjectSidebarProps {
  projects: MermaidProject[];
  activeId?: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectSidebar({
  projects,
  activeId,
  query,
  onQueryChange,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
}: ProjectSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div>
          <span className="brand-mark">M</span>
        </div>
        <div>
          <h1>Mermaid Studio</h1>
          <p>实时预览与结构编辑</p>
        </div>
      </div>

      <button className="primary-action" onClick={onCreate}>
        <FilePlus2 size={18} />
        新建图表
      </button>

      <label className="search-box">
        <Search size={17} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="搜索项目"
        />
      </label>

      <div className="project-list">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`project-item ${project.id === activeId ? 'is-active' : ''}`}
          >
            <button className="project-main" onClick={() => onSelect(project.id)}>
              <span className="project-kind">{project.kind}</span>
              <strong>{project.name}</strong>
              <small>{new Date(project.updatedAt).toLocaleString()}</small>
            </button>
            <span className="project-actions">
              <button title="复制项目" onClick={() => onDuplicate(project.id)}>
                <Copy size={15} />
              </button>
              <button title="删除项目" onClick={() => onDelete(project.id)}>
                <Trash2 size={15} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
