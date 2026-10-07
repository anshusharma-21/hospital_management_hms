import React from 'react';
import { AlertCircle, FolderOpen, RefreshCcw } from 'lucide-react';
import { Button } from './Button';

export const Skeleton = ({ className = '' }) => {
  return <div className={`animate-pulse bg-slate-200/70 rounded-lg ${className}`} />;
};

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'There are no active entries to display in this view.',
  actionLabel,
  onAction,
  actionIcon
}) => {
  return (
    <div className="py-12 px-4 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-3">
      <div className="p-3 rounded-xl bg-slate-100 text-slate-400 border border-slate-200">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-1.5">
          <Button onClick={onAction} icon={actionIcon} size="sm">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export const ErrorState = ({
  title = 'Unable to load records',
  error = 'A network or server error occurred while retrieving clinical records.',
  onRetry
}) => {
  return (
    <div className="p-6 rounded-xl bg-rose-50/60 border border-rose-200 text-center max-w-md mx-auto space-y-3">
      <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
        <AlertCircle className="w-4 h-4" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-rose-950">{title}</h4>
        <p className="text-xs text-rose-700 mt-1 leading-relaxed">{error}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="sm" icon={RefreshCcw}>
          Retry Connection
        </Button>
      )}
    </div>
  );
};
