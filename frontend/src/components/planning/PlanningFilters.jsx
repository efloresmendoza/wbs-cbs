export function PlanningFilters({ filters, setFilters, level1Options, level2Options, level3Options, level4Options, level5Options }) {
  return (
    <div className="mb-4 flex gap-3">
      <input
        placeholder="Search Activity Name"
        value={filters.activity_name}
        onChange={e => setFilters(prev => ({ ...prev, activity_name: e.target.value }))}
        className="px-3 py-2 border border-gray-300 rounded text-sm"
      />
      <select
        value={filters.wbs_level_1}
        onChange={e => setFilters(prev => ({ ...prev, wbs_level_1: e.target.value, wbs_level_2: '', wbs_level_3: '', wbs_level_4: '', wbs_level_5: '' }))}
        className="px-3 py-2 border border-gray-300 rounded text-sm"
      >
        <option value="">All WBS Level 1</option>
        {level1Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <select
        value={filters.wbs_level_2}
        onChange={e => setFilters(prev => ({ ...prev, wbs_level_2: e.target.value, wbs_level_3: '', wbs_level_4: '', wbs_level_5: '' }))}
        className="px-3 py-2 border border-gray-300 rounded text-sm"
        disabled={!filters.wbs_level_1}
      >
        <option value="">All WBS Level 2</option>
        {level2Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <select
        value={filters.wbs_level_3}
        onChange={e => setFilters(prev => ({ ...prev, wbs_level_3: e.target.value, wbs_level_4: '', wbs_level_5: '' }))}
        className="px-3 py-2 border border-gray-300 rounded text-sm"
        disabled={!filters.wbs_level_2}
      >
        <option value="">All WBS Level 3</option>
        {level3Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <select
        value={filters.wbs_level_4}
        onChange={e => setFilters(prev => ({ ...prev, wbs_level_4: e.target.value, wbs_level_5: '' }))}
        className="px-3 py-2 border border-gray-300 rounded text-sm"
        disabled={!filters.wbs_level_3}
      >
        <option value="">All WBS Level 4</option>
        {level4Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <select
        value={filters.wbs_level_5}
        onChange={e => setFilters(prev => ({ ...prev, wbs_level_5: e.target.value }))}
        className="px-3 py-2 border border-gray-300 rounded text-sm"
        disabled={!filters.wbs_level_4}
      >
        <option value="">All WBS Level 5</option>
        {level5Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  )
}