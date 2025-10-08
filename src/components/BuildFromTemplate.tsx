import { useNavigate } from 'react-router-dom';
import { createProjectFromTemplate } from '@/lib/store';
import type { TemplateManifest } from '@/types/project';

export function BuildFromTemplate({ manifest }: { manifest: TemplateManifest }) {
  const nav = useNavigate();
  const onBuild = async () => {
    const project = await createProjectFromTemplate(manifest);
    nav(`/design-studio/${project.id}`);
  };
  return <button className="btn btn-primary" onClick={onBuild}>Build</button>;
}