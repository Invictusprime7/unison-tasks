import { useParams } from 'react-router-dom';
import { useLiveProject } from '@/hooks/useLiveProject';
import { Canvas } from '@/components/Canvas';
import { CodePanel } from '@/components/CodePanel';

export default function DesignStudioPage() {
  const { id } = useParams();
  const { project, updateFile, save } = useLiveProject(id!);
  if (!project) return null;

  return (
    <div className="grid grid-cols-[1fr_440px] h-screen">
      <Canvas project={project}/>
      <aside className="border-l">
        <div className="p-2 flex items-center gap-2">
          <span className="font-semibold">{project.name}</span>
          <button className="btn btn-sm" onClick={save}>Save</button>
        </div>
        <CodePanel project={project} onChange={updateFile}/>
      </aside>
    </div>
  );
}