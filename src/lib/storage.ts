import Dexie, { type Table } from 'dexie';
import type { MermaidProject, EditorSettings } from '../types';

export interface ProjectRecord extends MermaidProject {}

export interface SettingRecord {
  id: string;
  value: EditorSettings;
}

class MermaidStudioDB extends Dexie {
  projects!: Table<ProjectRecord, string>;
  settings!: Table<SettingRecord, string>;

  constructor() {
    super('mermaid-studio');
    this.version(1).stores({
      projects: 'id, name, kind, updatedAt',
      settings: 'id',
    });
  }
}

export const db = new MermaidStudioDB();

export const DEFAULT_SETTINGS: EditorSettings = {
  theme: 'paper',
  previewScale: 1,
  showGrid: false,
};

export async function loadSettings(): Promise<EditorSettings> {
  const record = await db.settings.get('app-settings');
  return record?.value ?? DEFAULT_SETTINGS;
}

export async function saveSettings(value: EditorSettings): Promise<void> {
  await db.settings.put({ id: 'app-settings', value });
}

export async function listProjects(): Promise<ProjectRecord[]> {
  return db.projects.orderBy('updatedAt').reverse().toArray();
}

export async function upsertProject(project: ProjectRecord): Promise<void> {
  await db.projects.put(project);
}

export async function removeProject(id: string): Promise<void> {
  await db.projects.delete(id);
}

export async function getProject(id: string): Promise<ProjectRecord | undefined> {
  return db.projects.get(id);
}
