const statusLabel = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  LOCKED: 'Locked',
}

const statusClass = {
  NOT_STARTED: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  LOCKED: 'bg-green-100 text-green-700',
}

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-full ${statusClass[status] || 'bg-gray-100 text-gray-700'}`}>
      {statusLabel[status] || status}
    </span>
  )
}