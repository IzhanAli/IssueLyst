export function ListSkeleton() {
  return (
    <div className="h-full overflow-hidden">
      {[0, 1, 2].map((g) => (
        <div key={g}>
          <div className="flex h-9 items-center gap-2 bg-surface-2/70 px-3">
            <div className="skeleton h-3.5 w-24" />
          </div>
          {Array.from({ length: 4 - g }).map((_, i) => (
            <div key={i} className="flex h-[38px] items-center gap-3 border-b border-border/70 px-3">
              <div className="skeleton h-4 w-4 rounded-full" />
              <div className="skeleton h-3 w-12" />
              <div className="skeleton h-3" style={{ width: `${30 + ((i * 13) % 40)}%` }} />
              <div className="skeleton ml-auto h-5 w-16 rounded-full" />
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
    <div className="flex h-full gap-3 overflow-hidden p-3">
      {[0, 1, 2, 3].map((c) => (
        <div key={c} className="w-[288px] shrink-0">
          <div className="skeleton mb-2 h-6 w-32 rounded-md" />
          {Array.from({ length: 3 - (c % 2) }).map((_, i) => (
            <div key={i} className="skeleton mb-2 h-[92px] w-full rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}
