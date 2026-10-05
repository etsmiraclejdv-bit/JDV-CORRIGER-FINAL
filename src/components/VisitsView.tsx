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