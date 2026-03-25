export function PlanningTable({ extractedRows }) {
  return (
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
  )
}