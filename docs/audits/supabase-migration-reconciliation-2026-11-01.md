# Supabase migration reconciliation — 2026-11-01

## Changes made in this branch

The production migration history was compared by **version and applied name**, not by timestamp prefix alone.

| Previous GitHub file | Production history entry | Action |
|---|---|---|
| `20261012140000_fix_ambiguous_organization_id_company_finalize_v1.sql` | `20261012140108 / fix_ambiguous_organization_id_company_finalize_v1` | Renamed to the applied version |
| `20261012170000_prospecteur_barcode_shipments_schema_v1.sql` | `20261012195019 / jdv_prospecteur_barcode_shipments_schema_v1` | Renamed to the applied version |
| `20261012173000_prospecteur_barcode_shipment_rpcs_v1.sql` | `20261012195023 / jdv_prospecteur_barcode_shipment_rpcs_v1` | Renamed to the applied version |
| No matching GitHub file | `20261012070036 / subscription_tiers_invoices_limits_v1` | Recovered an idempotent invoice/counter migration from the live catalog |
| No matching GitHub file | `20261012070103 / fix_enforce_plan_limit_generic_fields_v1` | Recovered the applied generic plan-limit trigger function from the live catalog |
| No matching GitHub file | `20261012142248 / fix_company_finalize_on_conflict_ambiguous_columns` | Recovered the current company-finalization function from the live catalog |
| `20261013190000_lockdown_legacy_prospecteur_supply_rpc_v1.sql` | `20261101183945 / lockdown_legacy_prospecteur_supply_rpc_v1` | Applied to Supabase and renamed to its recorded version |
| `20261014060000_isolate_concepteur_operational_data.sql` | `20261101183935 / isolate_concepteur_operational_data_v1` | Applied to Supabase and renamed to its recorded version |
| Social automation migration | Not applied by design | Moved to `supabase/pending_migrations/` until provider OAuth, scopes, and publication approval are verified |

## Important qualification

The three missing historical files were reconstructed from the current production catalog, because the original SQL artifacts were not present in GitHub. Their definitions reflect the live schema, but they are **recovered artifacts, not a byte-for-byte copy of the original migration commits**. A clean-database migration replay is still required before certifying a fresh installation.

The social automation migration is deliberately outside `supabase/migrations/` so a routine `supabase db push` cannot enable unapproved social automation or create OAuth-token storage before provider authorization is ready.

## Production permission changes already applied

- `private.is_org_admin(uuid)` now requires an active organization membership with role `business_admin` or `admin`; super-admin status alone no longer grants company-wide operational access.
- Company operational policies now use organization-scoped checks.
- The legacy mutating prospecteur-supply RPC is executable only by `service_role`, not by `anon` or `authenticated`.
- The plan-limit trigger bypass is scoped to `service_role` or the super-admin's **own organization**, not every customer organization.

No company rows, stock rows, payment rows, or organization rows were deleted or rewritten by these changes.
