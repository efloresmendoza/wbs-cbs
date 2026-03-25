import { useEffect, useMemo, useState } from 'react'
import { loadProjects, createProject } from '../api/projects.js'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({project_id: '', project_name: '', project_group: ''})
  const [submitting, setSubmitting] = useState(false)

  async function fetchProjects() {
    setLoading(true)
    setError(null)
    try {
      const data = await loadProjects()
      setProjects(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const stats = useMemo(() => {
    const total = projects.length
    const wbsLoaded = projects.filter(p => p.wbs_loaded).length
    const cbsLoaded = projects.filter(p => p.cbs_loaded).length
    const mappingSets = projects.filter(p => p.mapping_status !== 'NOT_STARTED').length
    return { total, wbsLoaded, cbsLoaded, mappingSets }
  }, [projects])

  async function handleCreateProject(event) {
    event.preventDefault()
    if (!form.project_id.trim() || !form.project_name.trim()) {
      setError('Project ID and Project Name are required.')
      return
    }
    setSubmitting(true)
    setError(null)

    try {
      await createProject(form)
      setForm({ project_id: '', project_name: '', project_group: '' })
      setError(null)
      await fetchProjects()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    projects,
    loading,
    error,
    form,
    setForm,
    submitting,
    stats,
    handleCreateProject,
  }
}