import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] px-4">
      <div className="text-center max-w-sm">
        <h2 className="text-xl font-serif font-bold text-stone-800">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-stone-500">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block px-4 py-2 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-800 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
