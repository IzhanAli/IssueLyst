export function ListSkeleton() {
  return (
    <div className="h-full overflow-hidden">
      {[0, 1, 2].map((g) => (
        <div key={g}>
          <div className="flex h-10 items-center gap-2 border-b border-border bg-surface-2 px-3">
            <div className="skeleton h-3.5 w-24" />
          </div>
          {Array.from({ length: 4 - g }).map((_, i) => (
            <div key={i} className="flex h-10 items-center gap-3 border-b border-border/70 px-3">
              <div className="skeleton h-4 w-4 rounded-full" />
              <div className="skeleton h-3 w-12" />
              <div className="skeleton h-3" style={{ width: `${30 + ((i * 13) % 40)}%` }} />
              <div className="skeleton ml-auto h-5 w-16 rounded-[6px]" />
              <div className="skeleton h-6 w-6 rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="flex h-full gap-3 overflow-hidden p-4">
      {[0, 1, 2, 3].map((c) => (
        <div key={c} className="w-[288px] shrink-0">
          <div className="skeleton mb-2 h-8 w-32 rounded-[8px]" />
          <div className="rounded-[16px] bg-surface-2 p-2">
            {Array.from({ length: 3 - (c % 2) }).map((_, i) => (
              <div key={i} className="mb-2 flex h-[96px] w-full flex-col gap-2.5 rounded-[14px] bg-surface p-3 shadow-[inset_0_0_0_1px_var(--border)] last:mb-0">
                <div className="skeleton h-3 w-14" />
                <div className="skeleton h-3" style={{ width: `${55 + ((i * 17 + c * 11) % 35)}%` }} />
                <div className="skeleton mt-auto h-4 w-20 rounded-[6px]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
