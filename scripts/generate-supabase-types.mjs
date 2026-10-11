#!/usr/bin/env node
/**
 * Regenerate public-schema types from the live Supabase project and preserve
 * the nullable RPC arguments accepted by their SQL function bodies.
 *
 * Requires the Supabase CLI to be available through npx and an authenticated
 * Supabase CLI session. This command reads schema metadata; it does not change
 * the database.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const projectId = 'arxhppptxeeyeexkdyjv';
let output = execFileSync(
  'npx',
  ['--yes', 'supabase', 'gen', 'types', 'typescript', '--project-id', projectId, '--schema', 'public'],
  { encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'] },
);

function patchRpcArgument(source, functionName, nextFunctionName, argumentName) {
  const startMarker = `      ${functionName}: {`;
  const endMarker = `      ${nextFunctionName}: {`;
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) {
    throw new Error(`Could not locate RPC type block: ${functionName}`);
  }
  const block = source.slice(start, end);
  const pattern = new RegExp(`(^\\s+${argumentName}: string)(,?$)`, 'm');
  if (!pattern.test(block)) {
    throw new Error(`Could not locate ${argumentName} in ${functionName}`);
  }
  return source.slice(0, start) + block.replace(pattern, `$1 | null$2`) + source.slice(end);
}

output = patchRpcArgument(output, 'jdvcrm_create_purchase_order_v1', 'jdvcrm_create_sale_return_v1', 'p_expected_date');
output = patchRpcArgument(output, 'jdvcrm_submit_company_application_v1', 'jdvcrm_subscription_lifecycle_job_v1', 'p_representative_birth_date');
output = patchRpcArgument(output, 'jdvcrm_warehouse_request_supply_v1', 'jdvcrm_warehouse_sales_v1', 'p_supplier_id');

writeFileSync('src/types/database.types.ts', output);
console.log('Updated src/types/database.types.ts from the live Supabase schema.');
