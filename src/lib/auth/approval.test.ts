import test from "node:test";
import assert from "node:assert/strict";
import {
  approvalDecision,
  canApproveMembers,
  isApprovalOpenPath,
  isApprovedRole,
} from "@/lib/auth/approval";

test("isApprovedRole admits member, keith and admin only", () => {
  assert.equal(isApprovedRole("member"), true);
  assert.equal(isApprovedRole("keith"), true);
  assert.equal(isApprovedRole("admin"), true);

  assert.equal(isApprovedRole("pending"), false);
  assert.equal(isApprovedRole(null), false);
  assert.equal(isApprovedRole(undefined), false);
  assert.equal(isApprovedRole(""), false);
  assert.equal(isApprovedRole("Member"), false);
  assert.equal(isApprovedRole("owner"), false);
});

test("canApproveMembers is limited to keith and admin", () => {
  assert.equal(canApproveMembers("keith"), true);
  assert.equal(canApproveMembers("admin"), true);
  assert.equal(canApproveMembers("member"), false);
  assert.equal(canApproveMembers("pending"), false);
  assert.equal(canApproveMembers(null), false);
});

test("isApprovalOpenPath covers the auth flow and framework assets", () => {
  for (const path of [
    "/login",
    "/signup",
    "/forgot-password",
    "/update-password",
    "/auth/callback",
    "/_next/data/build/index.json",
    "/favicon.ico",
  ]) {
    assert.equal(isApprovalOpenPath(path), true, path);
  }
});

test("isApprovalOpenPath matches whole segments, not prefixes", () => {
  for (const path of [
    "/",
    "/authors",
    "/login-help",
    "/stories",
    "/welcome",
    "/api/ask",
    "/pending",
    "/profile",
  ]) {
    assert.equal(isApprovalOpenPath(path), false, path);
  }
});

test("approved users pass through and are bounced off the pending page", () => {
  for (const role of ["member", "keith", "admin"]) {
    assert.equal(approvalDecision("/", role), "allow");
    assert.equal(approvalDecision("/stories/some-story", role), "allow");
    assert.equal(approvalDecision("/api/ask", role), "allow");
    assert.equal(approvalDecision("/welcome", role), "allow");
    assert.equal(approvalDecision("/pending", role), "redirect-home");
  }
});

test("pending users are sent to the pending page", () => {
  assert.equal(approvalDecision("/", "pending"), "redirect-pending");
  assert.equal(approvalDecision("/stories", "pending"), "redirect-pending");
  assert.equal(approvalDecision("/welcome", "pending"), "redirect-pending");
  assert.equal(approvalDecision("/profile/admin", "pending"), "redirect-pending");
});

test("a missing profile row is treated the same as pending", () => {
  assert.equal(approvalDecision("/", null), "redirect-pending");
  assert.equal(approvalDecision("/", undefined), "redirect-pending");
  assert.equal(approvalDecision("/api/ask", null), "forbid-api");
});

test("pending users get a 403 decision on API routes, not a redirect", () => {
  assert.equal(approvalDecision("/api/ask", "pending"), "forbid-api");
  assert.equal(approvalDecision("/api", "pending"), "forbid-api");
  assert.equal(
    approvalDecision("/api/admin/members/abc/approve", "pending"),
    "forbid-api"
  );
});

test("pending users can reach the pending page and auth routes without a loop", () => {
  assert.equal(approvalDecision("/pending", "pending"), "allow");
  assert.equal(approvalDecision("/auth/callback", "pending"), "allow");
  assert.equal(approvalDecision("/update-password", "pending"), "allow");
  assert.equal(approvalDecision("/login", null), "allow");
});
