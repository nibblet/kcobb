"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[50vh] px-4">
      <div className="text-center max-w-sm">
        <h2 className="text-xl font-serif font-bold text-stone-800">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-stone-500">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-800 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
