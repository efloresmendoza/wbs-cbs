export function ProjectForm({ form, setForm, onSubmit, submitting, error }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h2 className="text-lg font-semibold">Create Project</h2>
      <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-3 items-end">
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
  )
}