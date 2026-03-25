import { useCallback, useEffect, useState } from 'react'
import { loadExtractedRows, uploadPlanning, processWBS, downloadTemplate } from '../api/projects.js'

export function usePlanning(selectedProject) {
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [extractedRows, setExtractedRows] = useState([])
  const [filters, setFilters] = useState({
    activity_name: '',
    wbs_level_1: '',
    wbs_level_2: '',
    wbs_level_3: '',
    wbs_level_4: '',
    wbs_level_5: '',
  })
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const fetchExtractedRows = useCallback(async () => {
    if (!selectedProject) return
    try {
      const data = await loadExtractedRows(selectedProject.id, filters)
      setExtractedRows(data)
    } catch (err) {
      setError(err.message)
    }
  }, [selectedProject, filters])

  useEffect(() => {
    fetchExtractedRows()
  }, [fetchExtractedRows])

  async function handleUploadPlanning(event) {
    event.preventDefault()
    if (!uploadFile) {
      setError('Please select a file')
      return
    }
    setUploading(true)
    setError(null)

    try {
      const data = await uploadPlanning(selectedProject.id, uploadFile)
      setUploadFile(null)
      setError(null)
      alert(data.message)
      await fetchExtractedRows()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleProcessWBS() {
    setProcessing(true)
    setError(null)

    try {
      const data = await processWBS(selectedProject.id)
      setError(null)
      alert(data.message)
      await fetchExtractedRows()
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const level1Options = [...new Set(extractedRows.map(r => r.wbs_level_1).filter(Boolean))]
  const level2Options = [...new Set(extractedRows.filter(r => r.wbs_level_1 === filters.wbs_level_1).map(r => r.wbs_level_2).filter(Boolean))]
  const level3Options = [...new Set(extractedRows.filter(r => r.wbs_level_2 === filters.wbs_level_2).map(r => r.wbs_level_3).filter(Boolean))]
  const level4Options = [...new Set(extractedRows.filter(r => r.wbs_level_3 === filters.wbs_level_3).map(r => r.wbs_level_4).filter(Boolean))]
  const level5Options = [...new Set(extractedRows.filter(r => r.wbs_level_4 === filters.wbs_level_4).map(r => r.wbs_level_5).filter(Boolean))]

  return {
    uploadFile,
    setUploadFile,
    uploading,
    extractedRows,
    filters,
    setFilters,
    processing,
    error,
    setError,
    handleUploadPlanning,
    handleProcessWBS,
    downloadTemplate,
    level1Options,
    level2Options,
    level3Options,
    level4Options,
    level5Options,
  }
}