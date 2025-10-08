export type Engine = 'static-html' | 'react-dom' | 'react-vite';

export type TemplateManifest = {
  id: string;
  name: string;
  engine: Engine;
  entry: string;                 // e.g. "/index.html" or "/src/App.tsx"
  files: Record<string, string>; // "/path": file contents
  preview?: string;
  meta?: { tags?: string[]; author?: string };
};

export type Project = {
  id: string;
  name: string;
  engine: Engine;
  entry: string;
  files: Record<string, string>;
  assets?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
  version?: number;
};