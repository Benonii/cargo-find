const SearchIcon = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

export const SearchChips = ({ searches }: { searches: string[] }) => {
  const unique = [...new Set(searches)];
  if (unique.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] text-ink-3">
        {unique.length} {unique.length === 1 ? 'search' : 'searches'} on cargo-find
      </span>
      <ul className="flex flex-col gap-1">
        {unique.map((search, index) => (
          <li
            key={search}
            className="flex min-w-0 items-center gap-2"
            style={{ animation: `fade-up 300ms cubic-bezier(0.23,1,0.32,1) ${index * 60}ms both` }}
          >
            <span className="flex size-4 shrink-0 items-center justify-center text-ink-3">{SearchIcon}</span>
            <span className="shrink-0 text-[12.5px] font-medium text-ink">find_action</span>
            <span className="min-w-0 truncate rounded-chip bg-surface px-1.5 py-0.5 text-[11.5px] text-ink-2 shadow-hairline">
              {search}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
