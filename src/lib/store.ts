import { db } from '@/lib/db';
import type { Project, TemplateManifest } from '@/types/project';

export async function createProjectFromTemplate(m: TemplateManifest): Promise<Project> {
  const now = Date.now();
  const project: Project = {
    id: crypto.randomUUID(),
    name: m.name,
    engine: m.engine,
    entry: m.entry,
    files: structuredClone(m.files),
    createdAt: now,
    updatedAt: now,
    version: 1
  };
  await db.projects.put(project);
  return project;
}

export async function getProject(id: string) {
  return db.projects.get(id);
}

export async function saveProject(p: Project) {
  p.updatedAt = Date.now();
  await db.projects.put(p);
}