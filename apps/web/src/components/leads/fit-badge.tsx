'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function FitBadge({
  score,
  reasoning,
}: {
  score?: number | null;
  reasoning?: string | null;
}) {
  if (score === null || score === undefined) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-muted-foreground bg-muted/70 cursor-help" />}>
            Scoring...
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            {reasoning || 'AI match scoring in progress...'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const color =
    score >= 75
      ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 ring-1 ring-green-500/30'
      : score >= 50
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 ring-1 ring-yellow-500/30'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 ring-1 ring-gray-500/30';

  const content = reasoning || `${score}% fit match based on your candidate profile`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${color} cursor-help transition-all`} />}>
          {score}% fit
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
