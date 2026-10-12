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
    <div className="w-full bg-white/85 backdrop-blur-xl border border-white/70 rounded-2xl p-5 my-6 shadow-xl shadow-blue-950/5">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="truncate">
          <p className="text-sm font-bold text-slate-900 truncate">{status}</p>
          {substatus && (
            <p className="text-xs text-slate-500 truncate mt-0.5">{substatus}</p>
          )}
        </div>
        <span className="font-mono text-sm font-bold text-blue-600 tabular-nums shrink-0 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
          {clamped}%
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-0.5">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 rounded-full transition-all duration-300 ease-out shadow-sm"
          style={{ width: `${clamped}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 font-medium mt-2.5">
        <span>Processing pipeline</span>
        <span className="font-mono tabular-nums text-slate-600">
          {clamped === 100 ? 'Ready for export' : 'Optimizing file payload'}
        </span>
      </div>
    </div>
  );
};
