import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PendingSignOutButton } from "./PendingSignOutButton";

export const metadata: Metadata = { title: "Awaiting approval" };

export default async function PendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="type-page-title text-3xl">The Cobb Family</h1>
          <h2 className="type-page-title mt-1 text-3xl">Story Library</h2>
        </div>

        <div className="space-y-4 rounded-lg border border-[var(--color-border)] bg-warm-white p-6 text-center">
          <p className="type-ui font-semibold text-ink">
            This is a private family site.
          </p>
          <p className="font-[family-name:var(--font-lora)] text-sm leading-relaxed text-ink-muted">
            Your account is awaiting approval. Once a family administrator
            approves it, you&apos;ll be able to read the stories here. If you
            are family, let them know you&apos;ve signed up.
          </p>
          {user.email && (
            <p className="type-meta text-ink-ghost">
              Signed in as {user.email}
            </p>
          )}
          <PendingSignOutButton />
        </div>
      </div>
    </div>
  );
}
