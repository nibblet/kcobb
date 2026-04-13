import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-[var(--page-padding-x)]">
      <div className="max-w-sm text-center">
        <h2 className="type-page-title text-xl">Page not found</h2>
        <p className="type-ui mt-2 text-ink-muted">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="type-ui mt-4 inline-block rounded-lg bg-clay px-4 py-2 font-medium text-warm-white transition-colors hover:bg-clay-mid"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
