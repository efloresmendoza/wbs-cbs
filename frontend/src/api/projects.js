const API_BASE = '/api/projects/'

export async function loadProjects() {
  const res = await fetch(API_BASE)
  if (!res.ok) throw new Error('Unable to fetch projects')
  return await res.json()
}

export async function createProject(form) {
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
    } catch {
      if (raw) message = raw
    }
    throw new Error(message)
  }
  return await res.json()
}

export async function loadExtractedRows(projectId, filters) {
  const params = new URLSearchParams()
  if (filters.activity_name) params.append('activity_name', filters.activity_name)
  for (let level = 1; level <= 5; level += 1) {
    const value = filters[`wbs_level_${level}`]
    if (value) params.append(`wbs_level_${level}`, value)
  }
  const res = await fetch(`${API_BASE}${projectId}/planning-extract/?${params}`)
  if (!res.ok) throw new Error('Unable to fetch extracted rows')
  return await res.json()
}

export async function uploadPlanning(projectId, file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}${projectId}/planning-upload/`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Upload failed')
  }
  return await res.json()
}

export async function processWBS(projectId) {
  const res = await fetch(`${API_BASE}${projectId}/planning-process/`, {
    method: 'POST',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Processing failed')
  }
  return await res.json()
}

export function downloadTemplate() {
  window.open('/api/planning-template/', '_blank')
}