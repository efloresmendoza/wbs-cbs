import { ProjectStats } from '../components/projects/ProjectStats.jsx'
import { ProjectForm } from '../components/projects/ProjectForm.jsx'

export function DashboardPage({ stats, form, setForm, onCreateProject, submitting, error }) {
  return (
    <main className="space-y-5">
      <ProjectStats stats={stats} />
      <ProjectForm form={form} setForm={setForm} onSubmit={onCreateProject} submitting={submitting} error={error} />
    </main>
  )
}