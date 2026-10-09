# Supabase migration history reconciliation

Date: 2026-10-09  
Production project: `arxhppptxeeyeexkdyjv` (`eu-west-1`)

## Static reconciliation result

A fresh read-only comparison of the live Supabase migration history with the reconciliation branch's `supabase/migrations/*.sql` filenames returned:

- **136** migration versions recorded in production.
- **132** migration SQL files in the repository.
- **0** repository migration filename versions absent from the production history.
- **4** production migration versions with no corresponding repository SQL file.

The 11 mismatched filenames have been aligned to the corresponding production version strings on this branch. This resolves the filename/version mismatch found in the initial audit. It does **not** resolve the four missing source bodies or prove that the 11 carried-over SQL bodies match the exact statements deployed.

## Safety status

- This branch changes GitHub migration filenames and adds reconciliation/evidence documentation; no SQL was executed against production.
- No Supabase development branch was created, so no branch cost was incurred. Work continued using read-only production metadata inspection and GitHub source review only.
- Do not run `supabase db push`, `supabase migration up`, or a production reset until this reconciliation is reviewed.
- Matching a filename/version to the remote history does **not** prove the SQL body is identical to the SQL originally applied. Compare each renamed file with deployment artifacts, CI logs, backups, or the resulting live object definitions before merging.
- A clean rebuild has not yet been performed. The repository currently lacks a confirmed `supabase/config.toml`; four migration sources remain missing. Read-only findings are documented in [MIGRATION_RECONSTRUCTION_EVIDENCE.md](./MIGRATION_RECONSTRUCTION_EVIDENCE.md).

## Version mappings made on this branch

The following files were renamed to use the version recorded in Supabase. SQL bodies were carried over unchanged:

| Previous repository filename | Version recorded by Supabase / new filename |
| --- | --- |
| `20261007130000_fix_organization_applications_authenticated_grants_v1.sql` | `20261007124229_fix_organization_applications_authenticated_grants_v1.sql` |
| `20261007143000_finalize_company_application_v1.sql` | `20261007131402_finalize_company_application_v1.sql` |
| `20261008200000_warehouse_subwarehouses_admin_v1.sql` | `20261008183819_warehouse_subwarehouses_admin_v1.sql` |
| `20261008200500_harden_warehouse_subwarehouses_admin_v1.sql` | `20261008183835_harden_warehouse_subwarehouses_admin_v1.sql` |
| `20261008201000_preserve_warehouse_subwarehouse_history_v1.sql` | `20261008183922_preserve_warehouse_subwarehouse_history_v1.sql` |
| `20261008210000_warehouse_stock_journal_inventory_closure_v1.sql` | `20261008184729_warehouse_stock_journal_inventory_closure_v1.sql` |
| `20261008220000_link_stock_to_subwarehouses_v1.sql` | `20261008185008_link_stock_to_subwarehouses_v1.sql` |
| `20261008230000_subwarehouse_stock_journal_closure_v1.sql` | `20261008185724_subwarehouse_stock_journal_closure_v1.sql` |
| `20261008240000_return_traceability_agent_prospecteur_v1.sql` | `20261008185937_return_traceability_agent_prospecteur_v1.sql` |
| `20261008250000_ai_jdv_crm_sector_knowledge_v1.sql` | `20261008200212_ai_jdv_crm_sector_knowledge_v1_retry.sql` |
| `20261008260000_ai_jdv_crm_operational_sections_v1.sql` | `20261008200533_ai_jdv_crm_operational_sections_v1.sql` |

**Special review required:** the live history labels the sector knowledge migration as a retry. The repository SQL is idempotent in several places, but its equivalence to the exact successful retry has not been proven.

## Applied in production, source file not found in the repository

These four versions appear in the live migration history but have no corresponding SQL source file in `supabase/migrations`:

| Applied version | Applied name | Required action |
| --- | --- | --- |
| `20261008115141` | `ai_company_validation_v1` | Recover exact SQL from original deployment/source-control artifacts; otherwise reconstruct from live definitions and review manually. |
| `20261008174410` | `company_document_manual_review_v1` | Recover exact SQL and verify policies, storage access, and review workflow. |
| `20261009011506` | `agency_head_chef_agence_v1` | Recover exact SQL and verify schema, role permissions, and policies. |
| `20261009012135` | `scope_prospecteur_assignments_to_agency_v1` | Recover exact SQL and verify assignment scoping and RLS behavior. |

The exact paths were also checked against GitHub's commit history; no commits for these paths were returned. Do not fabricate migration bodies from names alone. The deployed schema is evidence for current behavior, but it is not a substitute for the original migration source when reproducing a clean database.

## Verified live-state evidence

Read-only definitions of the application validation/document-review functions, triggers and RLS policies, and warehouse/prospecteur assignment policies/RPCs are recorded in [MIGRATION_RECONSTRUCTION_EVIDENCE.md](./MIGRATION_RECONSTRUCTION_EVIDENCE.md). That evidence describes the current live behavior; it does not claim to reconstruct every historical statement or intermediate schema state.

## Final disposition

- **Completed without cost:** align the 11 migration filenames to live version numbers, perform a fresh static filename/version comparison, inspect the current database definitions for the four missing migrations' areas, and commit the evidence reports to the reconciliation branch.
- **Still unverified:** exact SQL equivalence for the 11 renamed files, original source bodies for four applied migrations, the full clean replay, and a schema/security diff against a rebuilt database.
- **Decision:** keep PR #2 in draft and do not merge or deploy it yet. A production migration push is not needed to reconcile these filenames and must not be used as a substitute for clean-replay testing.
- No Supabase development branch was created, and no production SQL was executed.
