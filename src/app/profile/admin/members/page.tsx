import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PENDING_ROLE, canApproveMembers } from "@/lib/auth/approval";
import { ApproveButton } from "./ApproveButton";

export const metadata: Metadata = { title: "Admin — Pending accounts" };

const PAGE_SIZE = 100;

type PendingAccount = {
  id: string;
  displayName: string;
  email: string | null;
  createdAt: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function PendingAccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("sb_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!canApproveMembers(profile?.role)) redirect("/profile");

  // RLS only exposes a user's own profile row, so listing other accounts
  // needs the service-role client. The role check above is what protects it.
  const admin = createAdminClient();
  const { data: rows, count } = await admin
    .from("sb_profiles")
    .select("id, display_name, created_at", { count: "exact" })
    .eq("role", PENDING_ROLE)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  const accounts: PendingAccount[] = await Promise.all(
    (rows ?? []).map(async (row) => {
      const { data } = await admin.auth.admin.getUserById(row.id);
      return {
        id: row.id,
        displayName: row.display_name?.trim() || "",
        email: data.user?.email ?? null,
        createdAt: row.created_at,
      };
    })
  );

  const total = count ?? accounts.length;

  return (
    <div className="mx-auto max-w-content px-[var(--page-padding-x)] py-10 md:py-14">
      <Link
        href="/profile"
        className="type-ui mb-4 inline-block text-ink-ghost no-underline transition-colors hover:text-ocean"
      >
        &larr; Profile
      </Link>

      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h1 className="type-page-title">Pending accounts</h1>
        <span className="type-meta text-ink-ghost">{total} waiting</span>
      </div>
      <p className="mb-8 font-[family-name:var(--font-lora)] text-sm leading-relaxed text-ink-muted">
        People who have signed up but can&apos;t read the library yet.
        Approve only accounts you recognise as family — sign-ups from other
        sites that share this login also appear here.
      </p>

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-warm-white p-6 text-center">
          <p className="type-ui text-ink">No accounts are waiting.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-warm-white p-5"
            >
              <div className="min-w-0">
                <p className="type-ui break-all font-semibold text-ink">
                  {a.email ?? "Email unavailable"}
                </p>
                <p className="type-meta text-ink-ghost">
                  {a.displayName ? `${a.displayName} · ` : ""}
                  Signed up {formatDate(a.createdAt)}
                </p>
              </div>
              <ApproveButton userId={a.id} label={a.email ?? a.displayName} />
            </li>
          ))}
        </ul>
      )}

      {total > accounts.length && (
        <p className="type-meta mt-6 text-ink-ghost">
          Showing the {accounts.length} most recent of {total}.
        </p>
      )}
    </div>
  );
}
