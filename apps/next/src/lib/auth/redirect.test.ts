import assert from "node:assert/strict";
import test from "node:test";
import { isCredentialPath, isProtectedPath, safeNext } from "./redirect.ts";

test("safeNext rejects external destinations", () => {
  assert.equal(safeNext(null), "/dashboard");
  assert.equal(safeNext("https://evil.example"), "/dashboard");
  assert.equal(safeNext("//evil.example"), "/dashboard");
  assert.equal(safeNext("/\\evil"), "/dashboard");
  assert.equal(safeNext("/dashboard/profile"), "/dashboard/profile");
});

test("route groups match the phase 2 map", () => {
  assert.equal(isProtectedPath("/dashboard/privacy"), true);
  assert.equal(isProtectedPath("/dashboard/period-tracker"), true);
  assert.equal(isProtectedPath("/dashboard/symptoms"), true);
  assert.equal(isProtectedPath("/dashboard/mental-wellness"), true);
  assert.equal(isProtectedPath("/dashboard/health-reports"), true);
  assert.equal(isProtectedPath("/dashboard/reminders"), true);
  assert.equal(isProtectedPath("/admin/users"), true);
  assert.equal(isProtectedPath("/login"), false);
  assert.equal(isCredentialPath("/login"), true);
  assert.equal(isCredentialPath("/reset-password"), false);
});
