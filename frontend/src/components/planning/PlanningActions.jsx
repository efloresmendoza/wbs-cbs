export function PlanningActions({ uploadFile, setUploadFile, onUpload, uploading, onProcess, processing, onDownloadTemplate }) {
  return (
    <div className="mb-4 flex gap-3 items-end">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Upload Planning Excel</label>
        <input type="file" accept=".xlsx,.xls" onChange={e => setUploadFile(e.target.files[0])} className="text-sm" />
      </div>
      <button type="button" onClick={onDownloadTemplate} className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold">
        Download Template
      </button>
      <button type="submit" disabled={uploading || !uploadFile} onClick={onUpload} className="px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 font-semibold disabled:opacity-50">
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      <button type="button" onClick={onProcess} disabled={processing} className="px-4 py-2 rounded-lg text-white bg-purple-600 hover:bg-purple-700 font-semibold disabled:opacity-50">
        {processing ? 'Processing...' : 'Process WBS Levels'}
      </button>
    </div>
  )
}