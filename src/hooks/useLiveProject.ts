import { useEffect, useState, useCallback } from 'react';
import { getProject, saveProject } from '@/lib/store';
import type { Project } from '@/types/project';

const debounce = (fn: Function, ms = 600) => {
  let t: any;
  return (...args: any[]) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

export function useLiveProject(id: string) {
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => { getProject(id).then(setProject); }, [id]);

  const updateFile = useCallback((path: string, content: string) => {
    setProject(prev => {
      if (!prev) return prev;
      const next = { ...prev, files: { ...prev.files, [path]: content } };
      debouncedSave(next);
      return next;
    });
  }, []);

  const renameFile = useCallback((from: string, to: string) => {
    setProject(prev => {
      if (!prev) return prev;
      const { [from]: content, ...rest } = prev.files;
      const next = { ...prev, files: { ...rest, [to]: content ?? '' } };
      debouncedSave(next);
      return next;
    });
  }, []);

  const save = useCallback(() => project && saveProject(project), [project]);

  const debouncedSave = useCallback(debounce(saveProject, 800), []);

  return { project, setProject, updateFile, renameFile, save };
}