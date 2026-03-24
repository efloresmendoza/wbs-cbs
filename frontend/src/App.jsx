import { useEffect, useMemo, useState } from 'react'

const API_BASE = '/api/projects/'

const statusLabel = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  LOCKED: 'Locked',
}

const statusClass = {
  NOT_STARTED: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  LOCKED: 'bg-green-100 text-green-700',
}

function App() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({project_id: '', project_name: '', project_group: ''})
  const [submitting, setSubmitting] = useState(false)

  const [selectedProject, setSelectedProject] = useState(null)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [extractedRows, setExtractedRows] = useState([])
  const [filters, setFilters] = useState({wbs_contains: '', wbs_level_1: '', wbs_level_2: ''})
  const [processing, setProcessing] = useState(false)

  async function loadProjects() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(API_BASE)
      if (!res.ok) throw new Error('Unable to fetch projects')
      const data = await res.json()
      setProjects(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const stats = useMemo(() => {
    const total = projects.length
    const wbsLoaded = projects.filter(p => p.wbs_loaded).length
    const cbsLoaded = projects.filter(p => p.cbs_loaded).length
    const mappingSets = projects.filter(p => p.mapping_status !== 'NOT_STARTED').length
    return { total, wbsLoaded, cbsLoaded, mappingSets }
  }, [projects])

  async function createProject(event) {
    event.preventDefault()
    if (!form.project_id.trim() || !form.project_name.trim()) {
      setError('Project ID and Project Name are required.')
      return
    }
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: form.project_id.trim(),
          project_name: form.project_name.trim(),
          project_group: form.project_group.trim() || null,
        }),
      })
      if (!res.ok) {
        let message = `Could not create project (HTTP ${res.status})`
        const raw = await res.text()
        try {
          const body = JSON.parse(raw)
          if (body.detail) message = body.detail
          else if (body.project_id) message = `Project ID: ${JSON.stringify(body.project_id)}`
          else if (body.project_name) message = `Project Name: ${JSON.stringify(body.project_name)}`
          else if (body.non_field_errors) message = body.non_field_errors.join(' ')
        } catch (_e) {
          if (raw) message = raw
        }
        throw new Error(message)
      }
      setForm({ project_id: '', project_name: '', project_group: '' })
      setError(null)
      await loadProjects()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function selectProject(project) {
    setSelectedProject(project)
    setExtractedRows([])
    setFilters({wbs_contains: '', wbs_level_1: '', wbs_level_2: ''})
    await loadExtractedRows()
  }

  async function loadExtractedRows() {
    if (!selectedProject) return
    const params = new URLSearchParams()
    if (filters.wbs_contains) params.append('wbs_contains', filters.wbs_contains)
    if (filters.wbs_level_1) params.append('wbs_level_1', filters.wbs_level_1)
    if (filters.wbs_level_2) params.append('wbs_level_2', filters.wbs_level_2)
    try {
      const res = await fetch(`${API_BASE}${selectedProject.id}/planning-extract/?${params}`)
      if (!res.ok) throw new Error('Unable to fetch extracted rows')
      const data = await res.json()
      setExtractedRows(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadExtractedRows()
  }, [filters])

  async function uploadPlanning(event) {
    event.preventDefault()
    if (!uploadFile) {
      setError('Please select a file')
      return
    }
    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', uploadFile)

    try {
      const res = await fetch(`${API_BASE}${selectedProject.id}/planning-upload/`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Upload failed')
      }
      const data = await res.json()
      setUploadFile(null)
      setError(null)
      alert(data.message)
      await loadExtractedRows() // show uploaded data preview before process
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function processWBS() {
    setProcessing(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}${selectedProject.id}/planning-process/`, {
        method: 'POST',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Processing failed')
      }
      const data = await res.json()
      setError(null)
      alert(data.message)
      await loadExtractedRows()
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  async function downloadTemplate() {
    try {
      window.open('/api/planning-template/', '_blank')
    } catch (err) {
      setError(err.message)
    }
  }

  const level1Options = [...new Set(extractedRows.map(r => r.wbs_level_1).filter(Boolean))]
  const level2Options = [...new Set(extractedRows.filter(r => r.wbs_level_1 === filters.wbs_level_1).map(r => r.wbs_level_2).filter(Boolean))]

  return (
    <div className="w-full max-w-[1240px] grid grid-cols-[220px_1fr] gap-4">
      <aside className="space-y-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200 h-fit">
        <div className="text-xl font-bold">WBS-CBS App</div>
        <nav className="space-y-2 text-sm">
          <a className="block px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-semibold">Dashboard</a>
          <a className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100">Projects</a>
        </nav>
      </aside>

      <main className="space-y-5">
        <header>
          <h1 className="text-3xl font-bold">{selectedProject ? `Planning for ${selectedProject.project_name}` : 'Projects'}</h1>
        </header>

        {!selectedProject && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Total Projects</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-500">WBS Structures Loaded</p>
                <p className="text-3xl font-bold">{stats.wbsLoaded}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-500">CBS Structures Loaded</p>
                <p className="text-3xl font-bold">{stats.cbsLoaded}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Active Mapping Sets</p>
                <p className="text-3xl font-bold">{stats.mappingSets}</p>
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold">Create Project</h2>
              <form onSubmit={createProject} className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Project ID</label>
                  <input value={form.project_id} onChange={e => setForm(prev => ({ ...prev, project_id: e.target.value }))} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Project Name</label>
                  <input value={form.project_name} onChange={e => setForm(prev => ({ ...prev, project_name: e.target.value }))} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Project Group</label>
                  <input value={form.project_group} onChange={e => setForm(prev => ({ ...prev, project_group: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
                <button type="submit" disabled={submitting} className="w-full lg:w-auto px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-semibold disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </form>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold mb-3">Project List</h2>
              {loading ? (
                <p className="text-sm text-gray-500">Loading projects...</p>
              ) : (
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
                            <span className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-full ${statusClass[project.mapping_status] || 'bg-gray-100 text-gray-700'}`}>
                              {statusLabel[project.mapping_status] || project.mapping_status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-600">{new Date(project.updated_at).toLocaleString()}</td>
                          <td className="px-4 py-2">
                            <button onClick={() => selectProject(project)} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                              View Planning
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {selectedProject && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Planning Upload</h2>
              <button onClick={() => setSelectedProject(null)} className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700">
                Back to Projects
              </button>
            </div>

            <form onSubmit={uploadPlanning} className="mb-4 flex gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Upload Planning Excel</label>
                <input type="file" accept=".xlsx,.xls" onChange={e => setUploadFile(e.target.files[0])} className="text-sm" />
              </div>
              <button type="button" onClick={downloadTemplate} className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold">
                Download Template
              </button>
              <button type="submit" disabled={uploading || !uploadFile} className="px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 font-semibold disabled:opacity-50">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button type="button" onClick={processWBS} disabled={processing} className="px-4 py-2 rounded-lg text-white bg-purple-600 hover:bg-purple-700 font-semibold disabled:opacity-50">
                {processing ? 'Processing...' : 'Process WBS Levels'}
              </button>
            </form>

            <div className="mb-4 flex gap-3">
              <input
                placeholder="Search WBS"
                value={filters.wbs_contains}
                onChange={e => setFilters(prev => ({ ...prev, wbs_contains: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <select
                value={filters.wbs_level_1}
                onChange={e => setFilters(prev => ({ ...prev, wbs_level_1: e.target.value, wbs_level_2: '' }))}
                className="px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">All WBS Level 1</option>
                {level1Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select
                value={filters.wbs_level_2}
                onChange={e => setFilters(prev => ({ ...prev, wbs_level_2: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded text-sm"
                disabled={!filters.wbs_level_1}
              >
                <option value="">All WBS Level 2</option>
                {level2Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-1 font-medium text-gray-600">WBS</th>
                    <th className="px-2 py-1 font-medium text-gray-600">WBS Name</th>
                    <th className="px-2 py-1 font-medium text-gray-600">Activity ID</th>
                    <th className="px-2 py-1 font-medium text-gray-600">Activity Name</th>
                    <th className="px-2 py-1 font-medium text-gray-600">Start</th>
                    <th className="px-2 py-1 font-medium text-gray-600">Finish</th>
                    <th className="px-2 py-1 font-medium text-gray-600">link_01</th>
                    <th className="px-2 py-1 font-medium text-gray-600">link_02</th>
                    <th className="px-2 py-1 font-medium text-gray-600">link_03</th>
                    <th className="px-2 py-1 font-medium text-gray-600">link_04</th>
                    <th className="px-2 py-1 font-medium text-gray-600">start_date_clean</th>
                    <th className="px-2 py-1 font-medium text-gray-600">end_date_clean</th>
                    <th className="px-2 py-1 font-medium text-gray-600">Wbs Level</th>
                    {Array.from({length: 10}, (_, i) => (
                      <th key={i} className="px-2 py-1 font-medium text-gray-600">WBS level {i+1}</th>
                    ))}
                    <th className="px-2 py-1 font-medium text-gray-600">CBS_1</th>
                    <th className="px-2 py-1 font-medium text-gray-600">CBS_2</th>
                    <th className="px-2 py-1 font-medium text-gray-600">CONTROL ACCOUNT</th>
                    <th className="px-2 py-1 font-medium text-gray-600">CONTROL ACCOUNT NAME</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedRows.map(row => (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="px-2 py-1 text-gray-700">{row.wbs}</td>
                      <td className="px-2 py-1 text-gray-700">{row.wbs_name}</td>
                      <td className="px-2 py-1 text-gray-700">{row.activity_id || '-'}</td>
                      <td className="px-2 py-1 text-gray-700">{row.activity_name || '-'}</td>
                      <td className="px-2 py-1 text-gray-700">{row.start || '-'}</td>
                      <td className="px-2 py-1 text-gray-700">{row.finish || '-'}</td>
                      <td className="px-2 py-1 text-gray-700">{row.link_01 || '-'}</td>
                      <td className="px-2 py-1 text-gray-700">{row.link_02 || '-'}</td>
                      <td className="px-2 py-1 text-gray-700">{row.link_03 || '-'}</td>
                      <td className="px-2 py-1 text-gray-700">{row.link_04 || '-'}</td>
                      <td className="px-2 py-1 text-gray-700">{row.start_date_clean || '-'}</td>
                      <td className="px-2 py-1 text-gray-700">{row.end_date_clean || '-'}</td>
                      <td className="px-2 py-1 text-gray-700">{row.wbs_level}</td>
                      {Array.from({length: 10}, (_, i) => (
                        <td key={i} className="px-2 py-1 text-gray-700">{row[`wbs_level_${i+1}`] || '-'}</td>
                      ))}
                      <td className="px-2 py-1 text-gray-700">{row.cbs_1 || '-'}</td>
                      <td className="px-2 py-1 text-gray-700">{row.cbs_2 || '-'}</td>
                      <td className="px-2 py-1 text-gray-700">{row.control_account || '-'}</td>
                      <td className="px-2 py-1 text-gray-700">{row.control_account_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </main>
    </div>
  )
}

export default App
