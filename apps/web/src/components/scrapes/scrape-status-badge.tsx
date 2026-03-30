type ScrapeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

const statusConfig: Record<ScrapeStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  running: { label: 'Running', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
};

export function ScrapeStatusBadge({ status }: { status: ScrapeStatus }) {
  const config = statusConfig[status] ?? statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {status === 'running' && (
        <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-blue-500" />
      )}
      {config.label}
    </span>
  );
}
