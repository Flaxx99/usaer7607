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
