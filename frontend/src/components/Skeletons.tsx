/**
 * PageSkeleton
 * Consistent loading skeleton for full-page content areas.
 */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header skeleton */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="skeleton w-13 h-13 rounded-full" />
              <div className="flex flex-col gap-1">
                <div className="skeleton h-7 w-56" />
                <div className="skeleton h-4 w-44" />
              </div>
            </div>
            <div className="skeleton h-9 w-44" />
          </div>
        </div>
      </div>

      {/* Filter/Search skeleton */}
      <div className="card bg-base-100 shadow-xs">
        <div className="card-body p-4">
          <div className="skeleton h-9 w-full" />
        </div>
      </div>

      {/* Content rows skeleton */}
      <div className="card bg-base-100 shadow-xs">
        <div className="card-body p-4">
          <div className="flex flex-col gap-4">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="skeleton w-9 h-9 rounded-full shrink-0" />
                  <div className="flex flex-col gap-1">
                    <div className="skeleton h-4 w-40" />
                    <div className="skeleton h-3 w-24" />
                  </div>
                </div>
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-4 w-16" />
                <div className="flex gap-1">
                  <div className="skeleton h-7 w-16" />
                  <div className="skeleton h-7 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TableSkeleton
 * Skeleton for table-based layouts.
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card bg-base-100 shadow-xs">
      <div className="card-body p-4">
        <div className="flex flex-col gap-4">
          {/* Header row */}
          <div className="flex justify-between opacity-60">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-4 w-24" />
          </div>
          {/* Data rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center justify-between border-t border-base-200 pt-3">
              <div className="flex items-center gap-2">
                <div className="skeleton w-9 h-9 rounded-full shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <div className="skeleton h-4 w-36" />
                  <div className="skeleton h-3 w-24" />
                </div>
              </div>
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-5 w-20" />
              <div className="skeleton h-5 w-14" />
              <div className="flex gap-1">
                <div className="skeleton h-7 w-16" />
                <div className="skeleton h-7 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * ValidationSkeleton
 * Skeleton for the RAE validation panel.
 */
export function ValidationSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="skeleton h-9 w-24" />
          <div className="skeleton h-7 w-64" />
        </div>
        <div className="skeleton h-11 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card bg-base-100 shadow-sm border border-base-300 p-5 space-y-4">
            <div className="skeleton h-4 w-32 border-b pb-2" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="flex justify-between items-center p-2 bg-base-200 rounded-lg">
                  <div className="skeleton h-3 w-16" />
                  <div className="skeleton h-5 w-8 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * DashboardSkeleton
 * Specialized skeleton for the main dashboard view.
 */
export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      {/* Hero skeleton */}
      <div className="card bg-base-200 shadow-xl h-40 w-full">
        <div className="card-body flex flex-row items-center gap-6">
          <div className="skeleton w-20 h-20 rounded-full" />
          <div className="flex flex-col gap-2">
            <div className="skeleton h-8 w-64" />
            <div className="skeleton h-4 w-48" />
          </div>
        </div>
      </div>

      {/* KPI grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card bg-base-100 shadow-sm border border-base-300 p-5">
            <div className="flex justify-between">
              <div className="skeleton w-12 h-12 rounded-xl" />
              <div className="skeleton w-4 h-4" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-8 w-16" />
              <div className="skeleton h-3 w-32" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Announcements skeleton */}
        <div className="card bg-base-100 shadow-sm border border-base-300 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="skeleton h-6 w-40" />
            <div className="skeleton h-6 w-16" />
          </div>
          <div className="divider my-0"></div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card bg-base-200 p-4 space-y-2">
                <div className="flex justify-between">
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-4 w-20" />
                </div>
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-3/4" />
                <div className="flex items-center gap-2 pt-2">
                  <div className="skeleton w-5 h-5 rounded-full" />
                  <div className="skeleton h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart skeleton */}
        <div className="card bg-base-100 shadow-sm border border-base-300 p-6 space-y-4">
          <div className="skeleton h-6 w-48" />
          <div className="divider my-0"></div>
          <div className="h-[350px] w-full bg-base-200 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}


/**
 * CardGridSkeleton
 * Skeleton for grid-based card layouts.
 */
export function CardGridSkeleton({ count = 6, cols = 3 }: { count?: number, cols?: number }) {
  const colsClass = cols === 1 ? 'grid-cols-1' : cols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3';
  return (
    <div className={`grid grid-cols-1 ${colsClass} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card bg-base-100 shadow-sm border border-base-300 p-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-2">
                <div className="skeleton h-5 w-32" />
                <div className="skeleton h-3 w-20" />
              </div>
              <div className="skeleton h-6 w-12" />
            </div>
            <div className="divider my-0"></div>
            <div className="flex flex-col gap-2">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-4 w-5/6" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-base-200">
              <div className="skeleton h-4 w-16" />
              <div className="flex gap-2">
                <div className="skeleton h-7 w-7" />
                <div className="skeleton h-7 w-7" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * EmptyState
 * Consistent empty state for when no data is available.
 * Pattern: centered card with icon, title, optional description, and optional CTA.
 */
interface EmptyStateProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  dashed?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, dashed }: EmptyStateProps) {
  return (
    <div className={`card ${dashed ? 'bg-base-100 border border-dashed border-base-300' : 'bg-base-200'} p-12 text-center flex flex-col items-center gap-4`}>
      <Icon size={64} className="text-base-content/20 mx-auto" />
      <p className="text-xl font-bold text-base-content/40">{title}</p>
      {description && <p className="text-base-content/30 max-w-md">{description}</p>}
      {action && (
        <button className="btn btn-white btn-lg shadow-md hover:scale-105 transition-transform mt-2" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * ErrorState
 * Consistent error state for full-page content areas.
 * Follows the Dashboard error card pattern with icon circle, title, detail, and retry.
 */
export function ErrorState({ 
  error, 
  onRetry,
  title = 'Error de Conexión',
  message = 'No pudimos contactar al backend. Verifica que el servidor esté activo.'
}: { 
  error?: Error | null;
  onRetry?: () => void;
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <div className="card bg-error/10 shadow-xl max-w-md w-full text-center border border-error/20">
        <div className="card-body items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-error">{title}</h3>
          <p className="text-sm text-error/80">{message}</p>
          {error?.message && (
            <p className="text-xs text-base-content/50">Detalle: {error.message}</p>
          )}
          {onRetry && (
            <div className="card-actions">
              <button onClick={onRetry} className="btn btn-error btn-sm">
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
