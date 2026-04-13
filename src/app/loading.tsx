export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-700" />
        <p className="mt-3 text-sm text-stone-500">Loading...</p>
      </div>
    </div>
  );
}
