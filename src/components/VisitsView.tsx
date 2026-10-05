'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle, Clock, MapPin, Phone, Plus, RefreshCw, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthContext } from '@/lib/auth/context';
import { getAdminOrganization } from '@/lib/auth/admin-org';
import { fetchProspecteurNames } from '@/lib/services/relancesService';
import { createVisit, fetchProspectOptions, fetchVisits, type ProspectOption, type VisitRecord } from '@/lib/services/visitsService';
import {
  VISIT_RESULTS,
  fromDatetimeLocal,
  mapsUrl,
  prospectsDueForFollowUp,
  summarizeVisits,
  toDatetimeLocal,
  validateVisit,
  visitResultLabel,
} from '@/lib/visits/helpers';
import { formatDateTimeFr } from '@/lib/platform/paymentsHelpers';
import { toTelHref } from '@/lib/relances/helpers';
import { inputClass, labelClass } from '@/lib/ui/forms';
import Modal from '@/components/ui/Modal';
import MetricCard from '@/components/ui/MetricCard';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

interface VisitsViewProps {
  /** « terrain » : le prospecteur saisit et consulte ses visites ; « business » : l'administrateur consulte toutes les visites. */
  mode: 'terrain' | 'business';
}

const RESULT_CLASSES: Record<string, string> = {
  sold: 'bg-green-500/20 text-green-400 border-green-500/30',
  interested: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  to_follow_up: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  not_interested: 'bg-red-500/20 text-red-400 border-red-500/30',
  absent: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  other: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const TH = 'text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase tracking-wider whitespace-nowrap';

interface FormState {
  prospect_id: string;
  visit_date: string;
  result: string;
  notes: string;
  next_follow_up_at: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

const emptyForm = (prospectId = ''): FormState => ({
  prospect_id: prospectId,
  visit_date: toDatetimeLocal(new Date()),
  result: '',
  notes: '',
  next_follow_up_at: '',
  address: '',
  latitude: null,
  longitude: null,
});

export default function VisitsView({ mode }: VisitsViewProps) {
  const isTerrain = mode === 'terrain';
  const [orgId, setOrgId] = useState<string | null>(null);
  const [prospecteurId, setProspecteurId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [prospects, setProspects] = useState<ProspectOption[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [prospecteurFilter, setProspecteurFilter] = useState('');

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    if (isTerrain) {
      const ctx = await getAuthContext();
      if (!ctx) {
        setError("Vous n'êtes pas connecté.");
        setLoading(false);
        return;
      }
      if (!ctx.prospecteurId || !ctx.prospecteurOrganizationId) {
        setError('Aucun profil prospecteur actif pour ce compte.');
        setLoading(false);
        return;
      }
      setOrgId(ctx.prospecteurOrganizationId);
      setProspecteurId(ctx.prospecteurId);
      const [v, p] = await Promise.all([
        fetchVisits(ctx.prospecteurOrganizationId, ctx.prospecteurId),
        fetchProspectOptions(ctx.prospecteurOrganizationId, ctx.prospecteurId),
      ]);
      if (v.error || p.error) setError(v.error || p.error || '');
      setVisits(v.data);
      setProspects(p.data);
    } else {
      const { orgId: org, error: guardError } = await getAdminOrganization();
      if (!org) {
        setError(guardError ?? 'Accès impossible.');
        setLoading(false);
        return;
      }
      setOrgId(org);
      const [v, n] = await Promise.all([fetchVisits(org), fetchProspecteurNames(org)]);
      if (v.error) setError(v.error);
      setVisits(v.data);
      setNames(n);
    }
    setLoading(false);
  }, [isTerrain]);

  useEffect(() => {
    void load();
  }, [load]);

  const now = useMemo(() => new Date(), [visits, prospects]); // eslint-disable-line react-hooks/exhaustive-deps
  const summary = useMemo(() => summarizeVisits(visits, now), [visits, now]);
  const due = useMemo(() => prospectsDueForFollowUp(prospects, now), [prospects, now]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    return visits.filter((v) => {
      if (resultFilter && (v.result ?? 'other') !== resultFilter) return false;
      if (prospecteurFilter && v.prospecteur_id !== prospecteurFilter) return false;
      if (!q) return true;
      return (
        v.contact_name.toLowerCase().includes(q) ||
        (v.notes ?? '').toLowerCase().includes(q) ||
        (v.address ?? '').toLowerCase().includes(q) ||
        (qDigits.length >= 3 && (v.contact_phone ?? '').replace(/\D/g, '').includes(qDigits))
      );
    });
  }, [visits, search, resultFilter, prospecteurFilter]);

  function openCreate(prospectId = '') {
    setForm(emptyForm(prospectId));
    setFormError('');
    setOpen(true);
  }

  function locate() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setFormError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    setFormError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: Math.round(pos.coords.latitude * 1e6) / 1e6,
          longitude: Math.round(pos.coords.longitude * 1e6) / 1e6,
        }));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setFormError("Position introuvable. Autorisez la localisation dans votre navigateur, ou laissez ce champ vide.");
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  }

  async function handleSave() {
    if (!orgId || !prospecteurId || saving) return;
    const input = {
      prospect_id: form.prospect_id,
      visit_date: fromDatetimeLocal(form.visit_date),
      result: form.result,
      notes: form.notes,
      next_follow_up_at: fromDatetimeLocal(form.next_follow_up_at),
      address: form.address,
      latitude: form.latitude,
      longitude: form.longitude,
    };
    const problem = validateVisit(input, new Date());
    if (problem) {
      setFormError(problem);
      return;
    }
    setSaving(true);
    const { error: err } = await createVisit(orgId, prospecteurId, input);
    setSaving(false);
    if (err) {
      setFormError(err);
      return;
    }
    toast.success('Visite enregistrée. La fiche du prospect a été mise à jour.');
    setOpen(false);
    void load();
  }

  if (loading && visits.length === 0 && !error) return <LoadingState message="Chargement des visites…" />;
  if (error && visits.length === 0 && prospects.length === 0 && !orgId) {
    return <ErrorState message={error} action={{ label: 'Réessayer', onClick: () => void load() }} />;
  }

  const prospecteurIds = Array.from(new Set(visits.map((v) => v.prospecteur_id)));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{isTerrain ? 'Mes visites' : 'Visites terrain'}</h1>
          <p className="text-sm text-[#A0AEC0] mt-1">
            {isTerrain ? 'Enregistrez vos visites chez les prospects et suivez vos relances' : 'Activité de visite de vos prospecteurs'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            disabled={loading}
            aria-label="Actualiser la liste"
            className="flex items-center gap-2 btn-outline-gold px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          {isTerrain && (
            <button onClick={() => openCreate()} className="flex items-center gap-2 btn-gold px-4 py-2.5 rounded-xl text-sm font-bold">
              <Plus size={14} />
              Nouvelle visite
            </button>
          )}
        </div>
      </div>