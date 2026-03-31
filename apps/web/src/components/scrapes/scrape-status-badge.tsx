import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ScrapeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

const statusConfig: Record<ScrapeStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  running: { label: 'Running', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground hover:bg-muted' },
};

export function ScrapeStatusBadge({ status }: { status: ScrapeStatus }) {
  const config = statusConfig[status] ?? statusConfig.pending;

  return (
    <Badge variant="secondary" className={cn('gap-1.5', config.className)}>
      {status === 'running' && (
        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
      )}
      {config.label}
    </Badge>
  );
}
