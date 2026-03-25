export function ProjectStats({ stats }) {
  return (
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
  )
}