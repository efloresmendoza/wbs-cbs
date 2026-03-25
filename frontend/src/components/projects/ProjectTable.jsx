import { StatusBadge } from '../common/StatusBadge.jsx'

export function ProjectTable({ projects, loading, onSelectProject }) {
  if (loading) {
    return (
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-lg font-semibold mb-3">Project List</h2>
        <p className="text-sm text-gray-500">Loading projects...</p>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h2 className="text-lg font-semibold mb-3">Project List</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 font-medium text-gray-600">Project</th>
              <th className="px-4 py-2 font-medium text-gray-600">Project Group</th>
              <th className="px-4 py-2 font-medium text-gray-600">WBS Status</th>
              <th className="px-4 py-2 font-medium text-gray-600">CBS Status</th>
              <th className="px-4 py-2 font-medium text-gray-600">Mapping Status</th>
              <th className="px-4 py-2 font-medium text-gray-600">Last Updated</th>
              <th className="px-4 py-2 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2">
                  <div className="font-semibold text-gray-800">{project.project_name}</div>
                  <div className="text-xs text-gray-500">{project.project_id}</div>
                </td>
                <td className="px-4 py-2 text-gray-700">{project.project_group || '-'}</td>
                <td className="px-4 py-2 text-gray-700">{project.wbs_loaded ? 'Loaded' : 'Not Loaded'}</td>
                <td className="px-4 py-2 text-gray-700">{project.cbs_loaded ? 'Loaded' : 'Not Loaded'}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={project.mapping_status} />
                </td>
                <td className="px-4 py-2 text-gray-600">{new Date(project.updated_at).toLocaleString()}</td>
                <td className="px-4 py-2">
                  <button onClick={() => onSelectProject(project)} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                    View Planning
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}