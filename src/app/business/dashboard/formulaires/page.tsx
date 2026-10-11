'use client';
import { useCallback, useEffect, useState } from 'react';
import { Eye, FilePlus2, Plus, Save, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchOrgProfile } from '@/lib/auth/context';
import { FIELD_TYPES } from '@/features/design-studio/defaults';
import {
  listCustomForms,
  loadCustomFormSchema,
  saveCustomForm,
} from '@/features/design-studio/designService';
import type { CustomFormDefinition, FormField } from '@/features/design-studio/types';

const emptyField = (): FormField => ({
  id: 'field-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
  label: 'Nouveau champ',
  type: 'text',
  required: false,
});

export default function FormStudioPage() {
  const [organizationId, setOrganizationId] = useState('');
  const [forms, setForms] = useState<CustomFormDefinition[]>([]);
  const [formId, setFormId] = useState('');
  const [formKey, setFormKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const reloadForms = useCallback(async (orgId: string) => {
    const result = await listCustomForms(orgId);
    if (result.error) {
      toast.error('Impossible de charger les formulaires. Vérifiez la migration du studio.');
      return;
    }
    setForms(result.data);
  }, []);

  useEffect(() => {
    let live = true;
    fetchOrgProfile()
      .then(async ({ data }) => {
        if (!live) return;
        const orgId = String((data as Record<string, unknown> | null)?.organization_id ?? '');
        if (!orgId) {
          toast.error('Aucune entreprise associée à ce compte.');
          setLoading(false);
          return;
        }
        setOrganizationId(orgId);
        await reloadForms(orgId);
        setLoading(false);
      })
      .catch(() => {
        if (live) {
          toast.error('Impossible de charger l’entreprise.');
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
  }, [reloadForms]);

  function newForm() {
    setFormId('');
    setFormKey('');
    setName('');
    setDescription('');
    setFields([]);
    setPreview(false);
  }

  async function selectForm(form: CustomFormDefinition) {
    setFormId(form.id);
    setFormKey(form.form_key);
    setName(form.name);
    setDescription(form.description ?? '');
    setPreview(false);
    const result = await loadCustomFormSchema(form.id);
    if (result.error) {
      toast.error('Impossible de charger la définition du formulaire.');
      return;
    }
    setFields(result.data.fields ?? []);
  }

  function patchField(id: string, patch: Partial<FormField>) {
    setFields((current) =>
      current.map((field) => (field.id === id ? { ...field, ...patch } : field))
    );
  }

  async function save(publish: boolean) {
    if (!organizationId) return;
    if (name.trim().length < 2) return toast.error('Donnez un nom au formulaire.');
    if (!formId && !/^[a-z][a-z0-9_]{1,79}$/.test(formKey))
      return toast.error(
        'La clé doit commencer par une minuscule et contenir uniquement des lettres, chiffres ou _ (2 à 80 caractères).'
      );
    if (fields.some((field) => !field.label.trim()))
      return toast.error('Chaque champ doit avoir un libellé.');
    setSaving(true);
    const result = await saveCustomForm({
      organizationId,
      formId: formId || undefined,
      formKey,
      name: name.trim(),
      description: description.trim(),
      schema: { fields },
      publish,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error.message || 'Enregistrement impossible.');
      return;
    }
    toast.success(publish ? 'Formulaire publié.' : 'Version brouillon enregistrée.');
    if (result.data?.id) setFormId(result.data.id);
    await reloadForms(organizationId);
  }

  if (loading)
    return (
      <div className="p-8 text-sm text-[#A0AEC0]">Chargement de l’éditeur de formulaires…</div>
    );

  return (
    <div className="space-y-6 p-5 sm:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
            Configuration entreprise
          </p>
          <h1 className="text-2xl font-bold text-white">Éditeur de formulaires</h1>
          <p className="mt-2 text-sm text-[#A0AEC0]">
            Créez des formulaires métier versionnés pour votre entreprise.
          </p>
        </div>
        <button
          onClick={newForm}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/30 px-4 py-2.5 text-sm text-[#F5E17A]"
        >
          <FilePlus2 size={15} /> Nouveau formulaire
        </button>
      </header>
      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-2 rounded-2xl border border-white/10 bg-[#0F2347] p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Formulaires de l’entreprise</h2>
          {forms.length === 0 ? (
            <p className="text-xs leading-5 text-[#A0AEC0]">
              Aucun formulaire personnalisé pour le moment.
            </p>
          ) : (
            forms.map((form) => (
              <button
                key={form.id}
                onClick={() => selectForm(form)}
                className={`block w-full rounded-xl border p-3 text-left ${formId === form.id ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10' : 'border-white/5 hover:bg-white/5'}`}
              >
                <span className="block text-sm font-medium text-white">{form.name}</span>
                <span className="mt-1 block text-xs text-[#718096]">
                  {form.form_key} · {form.status}
                </span>
              </button>
            ))
          )}
        </aside>
        <section className="space-y-5 rounded-2xl border border-white/10 bg-[#0F2347] p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-white">
              Nom du formulaire
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                placeholder="Ex. Nouveau prospect"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-2.5 text-sm"
              />
            </label>
            <label className="space-y-2 text-sm text-white">
              Clé technique
              <input
                value={formKey}
                onChange={(e) =>
                  setFormKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }
                disabled={!!formId}
                maxLength={80}
                placeholder="nouveau_prospect"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-2.5 text-sm disabled:opacity-60"
              />
            </label>
            <label className="space-y-2 text-sm text-white sm:col-span-2">
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={2}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-2.5 text-sm"
              />
            </label>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Champs ({fields.length})</h2>
              <p className="mt-1 text-xs text-[#718096]">
                Ajoutez, réordonnez ou rendez les champs obligatoires.
              </p>
            </div>
            <button
              onClick={() => setFields((current) => [...current, emptyField()])}
              className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-white"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-xl border border-white/10 bg-[#08152F]/70 p-3 sm:grid-cols-[minmax(0,1fr)_160px_auto]"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 text-xs text-[#718096]">{index + 1}</span>
                  <input
                    value={field.label}
                    onChange={(e) => patchField(field.id, { label: e.target.value })}
                    aria-label="Libellé du champ"
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0B1B3D] px-3 py-2 text-sm text-white"
                  />
                </div>
                <select
                  value={field.type}
                  onChange={(e) =>
                    patchField(field.id, { type: e.target.value as FormField['type'] })
                  }
                  aria-label="Type de champ"
                  className="rounded-lg border border-white/10 bg-[#0B1B3D] px-2 py-2 text-sm text-white"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs text-[#A0AEC0]">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => patchField(field.id, { required: e.target.checked })}
                    />{' '}
                    Obligatoire
                  </label>
                  <button
                    onClick={() => setFields((current) => current.filter((f) => f.id !== field.id))}
                    aria-label="Supprimer le champ"
                    className="rounded-lg p-2 text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {field.type === 'select' && (
                  <input
                    value={(field.options ?? []).join(', ')}
                    onChange={(e) =>
                      patchField(field.id, {
                        options: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Options séparées par des virgules"
                    className="sm:col-span-3 rounded-lg border border-white/10 bg-[#0B1B3D] px-3 py-2 text-xs text-white"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <button
              onClick={() => setPreview((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white"
            >
              <Eye size={15} />
              {preview ? 'Fermer l’aperçu' : 'Aperçu'}
            </button>
            <button
              disabled={saving}
              onClick={() => save(false)}
              className="flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 px-4 py-2.5 text-sm text-[#F5E17A] disabled:opacity-50"
            >
              <Save size={15} /> Enregistrer le brouillon
            </button>
            <button
              disabled={saving}
              onClick={() => save(true)}
              className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#0B1B3D] disabled:opacity-50"
            >
              <Send size={15} /> Publier une version
            </button>
          </div>
          {preview && (
            <div className="space-y-4 rounded-xl border border-[#D4AF37]/20 bg-[#08152F] p-4">
              <h3 className="font-semibold text-white">{name || 'Aperçu du formulaire'}</h3>
              {fields.length === 0 ? (
                <p className="text-sm text-[#A0AEC0]">
                  Ajoutez des champs pour prévisualiser le formulaire.
                </p>
              ) : (
                fields.map((field) => (
                  <label key={field.id} className="block space-y-1.5 text-sm text-[#D9E1EF]">
                    {field.label}
                    {field.required ? ' *' : ''}
                    {field.type === 'textarea' ? (
                      <textarea
                        disabled
                        rows={3}
                        className="w-full rounded-lg border border-white/10 bg-[#0B1B3D] p-2.5"
                      />
                    ) : field.type === 'checkbox' ? (
                      <input disabled type="checkbox" className="ml-2" />
                    ) : field.type === 'select' ? (
                      <select
                        disabled
                        className="w-full rounded-lg border border-white/10 bg-[#0B1B3D] p-2.5"
                      >
                        <option>Choisir…</option>
                        {(field.options ?? []).map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        disabled
                        type={
                          field.type === 'number'
                            ? 'number'
                            : field.type === 'date'
                              ? 'date'
                              : field.type === 'email'
                                ? 'email'
                                : 'text'
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#0B1B3D] p-2.5"
                      />
                    )}
                  </label>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
