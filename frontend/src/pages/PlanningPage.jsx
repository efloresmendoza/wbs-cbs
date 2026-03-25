import { PlanningActions } from '../components/planning/PlanningActions.jsx'
import { PlanningFilters } from '../components/planning/PlanningFilters.jsx'
import { PlanningTable } from '../components/planning/PlanningTable.jsx'

export function PlanningPage({ onBack, uploadFile, setUploadFile, onUpload, uploading, onProcess, processing, onDownloadTemplate, filters, setFilters, level1Options, level2Options, level3Options, level4Options, level5Options, extractedRows, error }) {
  return (
    <main className="space-y-5">
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Planning Upload</h2>
          <button onClick={onBack} className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700">
            Back to Projects
          </button>
        </div>

        <form onSubmit={onUpload}>
          <PlanningActions uploadFile={uploadFile} setUploadFile={setUploadFile} onUpload={onUpload} uploading={uploading} onProcess={onProcess} processing={processing} onDownloadTemplate={onDownloadTemplate} />
        </form>

        <PlanningFilters filters={filters} setFilters={setFilters} level1Options={level1Options} level2Options={level2Options} level3Options={level3Options} level4Options={level4Options} level5Options={level5Options} />

        <PlanningTable extractedRows={extractedRows} />
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </main>
  )
}