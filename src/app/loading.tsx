export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-clay-light border-t-clay"
          aria-hidden
        />
        <p className="type-ui mt-3 text-ink-muted">Loading...</p>
      </div>
    </div>
  );
}
