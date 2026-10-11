import { supabase } from '@/lib/supabase/client';
import type { Json } from '@/types/database.types';
import type {
  CustomFormDefinition,
  CustomFormSchema,
  DesignConfig,
  DesignScope,
  DesignVersion,
} from './types';

type DbRow = Record<string, unknown>;

export async function listDesignVersions(scope: DesignScope, organizationId?: string) {
  let query = supabase
    .from('design_config_versions')
    .select('*')
    .eq('scope', scope)
    .order('version_no', { ascending: false })
    .limit(30);
  if (scope === 'organization') {
    if (!organizationId)
      return { data: [] as DesignVersion[], error: new Error('Organisation manquante') };
    query = query.eq('organization_id', organizationId);
  } else {
    query = query.is('organization_id', null);
  }
  const { data, error } = await query;
  return { data: ((data ?? []) as DbRow[]).map((row) => row as unknown as DesignVersion), error };
}

export async function createDesignVersion(input: {
  scope: DesignScope;
  organizationId?: string;
  config: DesignConfig;
  status?: 'draft' | 'published';
}) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: new Error('Connexion requise') };
  let latestQuery = supabase
    .from('design_config_versions')
    .select('version_no')
    .eq('scope', input.scope)
    .order('version_no', { ascending: false })
    .limit(1);
  if (input.scope === 'organization') {
    if (!input.organizationId) return { data: null, error: new Error('Organisation manquante') };
    latestQuery = latestQuery.eq('organization_id', input.organizationId);
  } else {
    latestQuery = latestQuery.is('organization_id', null);
  }
  const { data: latest, error: latestError } = await latestQuery.maybeSingle();
  if (latestError) return { data: null, error: latestError };
  const versionNo = Number((latest as DbRow | null)?.version_no ?? 0) + 1;
  const nextStatus = input.status ?? 'draft';
  const { data, error } = await supabase
    .from('design_config_versions')
    .insert({
      scope: input.scope,
      organization_id: input.scope === 'organization' ? input.organizationId : null,
      version_no: versionNo,
      status: nextStatus,
      config: input.config as unknown as Json,
      created_by: userData.user.id,
      published_at: nextStatus === 'published' ? new Date().toISOString() : null,
    })
    .select('*')
    .single();
  if (error || !data) return { data: data as unknown as DesignVersion | null, error };

  // Publish the new version first, then archive older published versions so a failed
  // archive can never leave the scope without a published configuration.
  if (nextStatus === 'published') {
    let archiveQuery = supabase
      .from('design_config_versions')
      .update({ status: 'archived' })
      .eq('scope', input.scope)
      .eq('status', 'published')
      .neq('id', String((data as DbRow).id));
    archiveQuery =
      input.scope === 'organization'
        ? archiveQuery.eq('organization_id', input.organizationId!)
        : archiveQuery.is('organization_id', null);
    const { error: archiveError } = await archiveQuery;
    if (archiveError) {
      return {
        data: data as unknown as DesignVersion,
        error: new Error(
          'Version publiée, mais les anciennes versions n’ont pas toutes été archivées. Rechargez l’historique et vérifiez les statuts.'
        ),
      };
    }
  }
  return { data: data as unknown as DesignVersion, error: null };
}

export async function setDesignVersionStatus(
  id: string,
  status: 'draft' | 'published' | 'archived'
) {
  const { error } = await supabase
    .from('design_config_versions')
    .update({
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
    })
    .eq('id', id);
  return { error };
}

export async function listCustomForms(organizationId: string) {
  const { data, error } = await supabase
    .from('custom_form_definitions')
    .select('id, organization_id, form_key, name, description, status, updated_at')
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false });
  return { data: (data ?? []) as CustomFormDefinition[], error };
}

export async function loadCustomFormSchema(formId: string) {
  const { data, error } = await supabase
    .from('custom_form_versions')
    .select('schema_json, version_no, status')
    .eq('form_id', formId)
    .order('version_no', { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = data as DbRow | null;
  return {
    data: (row?.schema_json ?? { fields: [] }) as CustomFormSchema,
    error,
    versionNo: Number(row?.version_no ?? 0),
  };
}

export async function saveCustomForm(input: {
  organizationId: string;
  formId?: string;
  formKey: string;
  name: string;
  description: string;
  schema: CustomFormSchema;
  publish: boolean;
}) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: new Error('Connexion requise') };
  let formId = input.formId;
  if (formId) {
    const updates = {
      name: input.name,
      description: input.description || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('custom_form_definitions')
      .update(updates)
      .eq('id', formId)
      .eq('organization_id', input.organizationId);
    if (error) return { data: null, error };
  } else {
    const { data, error } = await supabase
      .from('custom_form_definitions')
      .insert({
        organization_id: input.organizationId,
        form_key: input.formKey,
        name: input.name,
        description: input.description || null,
        status: 'draft',
        created_by: userData.user.id,
      })
      .select('id')
      .single();
    if (error) return { data: null, error };
    formId = String((data as DbRow).id);
  }

  const { data: previous, error: previousError } = await supabase
    .from('custom_form_versions')
    .select('version_no')
    .eq('form_id', formId)
    .order('version_no', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (previousError) return { data: null, error: previousError };
  const versionNo = Number((previous as DbRow | null)?.version_no ?? 0) + 1;
  const { data: insertedVersion, error: versionError } = await supabase
    .from('custom_form_versions')
    .insert({
      form_id: formId,
      version_no: versionNo,
      schema_json: input.schema as unknown as Json,
      status: input.publish ? 'published' : 'draft',
      created_by: userData.user.id,
      published_at: input.publish ? new Date().toISOString() : null,
    })
    .select('id')
    .single();
  if (versionError) return { data: null, error: versionError };

  if (input.publish) {
    // Keep the new published version safe before archiving previous publications.
    const { error: archiveError } = await supabase
      .from('custom_form_versions')
      .update({ status: 'archived' })
      .eq('form_id', formId)
      .eq('status', 'published')
      .neq('id', String((insertedVersion as DbRow).id));
    if (archiveError) {
      return {
        data: { id: formId, versionNo },
        error: new Error(
          'Nouvelle version créée, mais les anciennes versions publiées n’ont pas toutes été archivées. Vérifiez l’historique du formulaire.'
        ),
      };
    }
    const { error: publishError } = await supabase
      .from('custom_form_definitions')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', formId)
      .eq('organization_id', input.organizationId);
    if (publishError) {
      return { data: { id: formId, versionNo }, error: publishError };
    }
  }
  return { data: { id: formId, versionNo }, error: null };
}
