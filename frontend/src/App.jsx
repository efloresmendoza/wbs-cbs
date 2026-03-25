import { useState } from 'react'
import { Sidebar } from './components/layout/Sidebar.jsx'
import { PageHeader } from './components/layout/PageHeader.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { ProjectsPage } from './pages/ProjectsPage.jsx'
import { PlanningPage } from './pages/PlanningPage.jsx'
import { useProjects } from './hooks/useProjects.js'
import { usePlanning } from './hooks/usePlanning.js'

function App() {
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard', 'projects', 'planning'
  const [selectedProject, setSelectedProject] = useState(null)

  const projectsHook = useProjects()
  const planningHook = usePlanning(selectedProject)

  const handleDashboard = () => {
    setCurrentView('dashboard')
    setSelectedProject(null)
  }

  const handleProjects = () => {
    setCurrentView('projects')
    setSelectedProject(null)
  }

  const handleSelectProject = (project) => {
    setSelectedProject(project)
    setCurrentView('planning')
  }

  const handleBack = () => {
    setSelectedProject(null)
    setCurrentView('dashboard')
  }

  const renderMain = () => {
    if (currentView === 'planning' && selectedProject) {
      return (
        <PlanningPage
          onBack={handleBack}
          uploadFile={planningHook.uploadFile}
          setUploadFile={planningHook.setUploadFile}
          onUpload={planningHook.handleUploadPlanning}
          uploading={planningHook.uploading}
          onProcess={planningHook.handleProcessWBS}
          processing={planningHook.processing}
          onDownloadTemplate={planningHook.downloadTemplate}
          filters={planningHook.filters}
          setFilters={planningHook.setFilters}
          level1Options={planningHook.level1Options}
          level2Options={planningHook.level2Options}
          level3Options={planningHook.level3Options}
          level4Options={planningHook.level4Options}
          level5Options={planningHook.level5Options}
          extractedRows={planningHook.extractedRows}
          error={planningHook.error}
        />
      )
    } else if (currentView === 'projects') {
      return (
        <ProjectsPage
          projects={projectsHook.projects}
          loading={projectsHook.loading}
          onSelectProject={handleSelectProject}
        />
      )
    } else {
      return (
        <DashboardPage
          stats={projectsHook.stats}
          form={projectsHook.form}
          setForm={projectsHook.setForm}
          onCreateProject={projectsHook.handleCreateProject}
          submitting={projectsHook.submitting}
          error={projectsHook.error}
        />
      )
    }
  }

  return (
    <div className="w-full min-h-screen mx-auto px-4 lg:px-8 grid grid-cols-[220px_minmax(0,1fr)] gap-4">
      <Sidebar onDashboard={handleDashboard} onProjects={handleProjects} />
      <div className="space-y-5">
        <PageHeader title={selectedProject ? `Planning for ${selectedProject.project_name}` : currentView === 'projects' ? 'Projects' : 'Projects'} />
        {renderMain()}
      </div>
    </div>
  )
}

export default App
