import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 - 100
  status: string;
  substatus?: string;
  isProcessing: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status,
  substatus,
  isProcessing,
}) => {
  if (!isProcessing && progress === 0) return null;

  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 my-6">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="truncate">
          <p className="text-sm font-medium text-neutral-200 truncate">{status}</p>
          {substatus && (
            <p className="text-xs text-neutral-400 truncate mt-0.5">{substatus}</p>
          )}
        </div>
        <span className="font-mono text-sm font-semibold text-neutral-200 tabular-nums shrink-0">
          {clamped}%
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-neutral-100 transition-all duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-400 mt-2">
        <span>Processing pipeline</span>
        <span className="font-mono tabular-nums">
          {clamped === 100 ? 'Ready for export' : 'Optimizing file payload'}
        </span>
      </div>
    </div>
  );
};
