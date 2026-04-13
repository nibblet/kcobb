"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-[var(--page-padding-x)]">
      <div className="max-w-sm text-center">
        <h2 className="type-page-title text-xl">Something went wrong</h2>
        <p className="type-ui mt-2 text-ink-muted">
          An unexpected error occurred. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="type-ui mt-4 rounded-lg bg-clay px-4 py-2 font-medium text-warm-white transition-colors hover:bg-clay-mid"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
