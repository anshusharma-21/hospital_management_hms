import React from 'react';
import { AlertCircle, FolderOpen, RefreshCcw } from 'lucide-react';
import { Button } from './Button';

export const Skeleton = ({ className = '' }) => {
  return <div className={`animate-pulse bg-slate-200/70 rounded-xl ${className}`} />;
};

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'There are no active entries to display right now.',
  actionLabel,
  onAction,
  actionIcon
}) => {
  return (
    <div className="py-14 px-4 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-3">
      <div className="p-3.5 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200/80">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button onClick={onAction} icon={actionIcon} size="sm">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export const ErrorState = ({
  title = 'Failed to load records',
  error = 'A network or server error occurred while retrieving clinical records.',
  onRetry
}) => {
  return (
    <div className="p-6 rounded-2xl bg-rose-50/60 border border-rose-200/80 text-center max-w-md mx-auto space-y-3">
      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-rose-900">{title}</h4>
        <p className="text-xs text-rose-600 mt-1">{error}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="sm" icon={RefreshCcw}>
          Retry Connection
        </Button>
      )}
    </div>
  );
};
