export function Sidebar({ onDashboard, onProjects }) {
  return (
    <aside className="space-y-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200 h-fit">
      <div className="text-xl font-bold">WBS-CBS App</div>
      <nav className="space-y-2 text-sm">
        <button
          type="button"
          onClick={onDashboard}
          className="w-full text-left px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-semibold"
        >
          Dashboard
        </button>
        <button
          type="button"
          onClick={onProjects}
          className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
        >
          Projects
        </button>
      </nav>
    </aside>
  )
}