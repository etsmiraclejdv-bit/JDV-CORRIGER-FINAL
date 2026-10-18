import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const worker = readFileSync(new URL("../supabase/functions/social-automation-worker/index.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20261018190000_jdv_social_automation_organic_v1.sql", import.meta.url), "utf8");

test("social worker is explicitly dry-run only and never calls a provider", () => {
  assert.match(worker, /mode: "dry_run_only"/);
  assert.match(worker, /provider_calls: 0/);
  assert.match(worker, /PROVIDER_ADAPTERS_NOT_IMPLEMENTED/);
  assert.doesNotMatch(worker, /graph.facebook.com|api.x.com|open.tiktokapis.com/);
});

test("social worker requires server-side shared secret and service role", () => {
  assert.match(worker, /JDV_SOCIAL_WORKER_SECRET/);
  assert.match(worker, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(worker, /suppliedSecret !== expectedSecret/);
});

test("social worker blocks unapproved, paused, paid, or out-of-window campaigns", () => {
  assert.match(worker, /INITIAL_APPROVAL_REQUIRED/);
  assert.match(worker, /CAMPAIGN_PAUSED/);
  assert.match(worker, /ORGANIC_ZERO_BUDGET_REQUIRED/);
  assert.match(worker, /OUTSIDE_VALIDATED_14_DAY_WINDOW/);
});

test("migration protects OAuth tokens from browser roles", () => {
  assert.match(migration, /revoke all on public.jdv_social_connection_secrets from anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on public.jdv_social_connection_secrets to service_role/i);
});

test("automatic mode is constrained to organic campaigns with zero budget", () => {
  assert.match(migration, /automation_mode\s*<>\s*'auto_14_days'\s+or\s+\(channel\s*=\s*'organic'\s+and\s+budget\s*=\s*0\)/i);
});
