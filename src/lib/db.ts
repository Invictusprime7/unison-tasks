import Dexie, { Table } from 'dexie';
import type { Project } from '@/types/project';

export class AppDB extends Dexie {
  projects!: Table<Project, string>;
  constructor() {
    super('unison-db');
    this.version(1).stores({
      projects: 'id, name, updatedAt' // id is PK
    });
  }
}
export const db = new AppDB();