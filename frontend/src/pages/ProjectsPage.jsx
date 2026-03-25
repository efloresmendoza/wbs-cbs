import { ProjectTable } from '../components/projects/ProjectTable.jsx'

export function ProjectsPage({ projects, loading, onSelectProject }) {
  return (
    <main className="space-y-5">
      <ProjectTable projects={projects} loading={loading} onSelectProject={onSelectProject} />
    </main>
  )
}