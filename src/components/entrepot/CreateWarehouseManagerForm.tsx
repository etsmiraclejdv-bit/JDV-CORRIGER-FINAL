'use client';

import { FormEvent, useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';

type WarehouseOption = {
  id: string;
  code: string;
  name: string;
  active: boolean;
  manager_user_id?: string | null;
};

type ManagerForm = {
  warehouseId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

export default function CreateWarehouseManagerForm({
  warehouses,
  onCreated,
}: {
  warehouses: WarehouseOption[];
  onCreated: () => void;
}) {
  const [canCreate, setCanCreate] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<ManagerForm>({
    warehouseId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  const availableWarehouses = warehouses.filter(
    (warehouse) => warehouse.active && !warehouse.manager_user_id
  );

  useEffect(() => {
    let active = true;
    getAuthContext()
      .then((context) => {
        if (active) setCanCreate(!!context?.isSuperAdmin || !!context?.isOrgAdmin);
      })
      .catch(() => {
        if (active) setCanCreate(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!canCreate) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!form.warehouseId) {
      setMessage('Choisissez un entrepôt sans chef actif.');
      return;
    }

    setBusy(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (sessionError || !accessToken) {
        throw new Error('Votre session a expiré. Reconnectez-vous.');
      }

      const response = await fetch('/api/business/create-warehouse-manager', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Création impossible.');

      setMessage(result.message || 'Chef d’entrepôt créé.');
      setForm({
        warehouseId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
      });
      setExpanded(false);
      onCreated();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Création impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#D4AF37]/20 bg-[#0F2347] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <UserPlus size={18} className="text-[#D4AF37]" />
            Chefs d’entrepôt
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Créez un compte responsable et rattachez-le à un seul entrepôt.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="rounded-xl border border-[#D4AF37]/30 px-4 py-2 text-sm font-semibold text-[#D4AF37]"
        >
          {expanded ? 'Fermer' : 'Créer un chef'}
        </button>
      </div>

      {message && (
        <p
          role="status"
          className="mt-3 rounded-lg border border-white/10 p-3 text-sm text-slate-200"
        >
          {message}
        </p>
      )}

      {expanded && (
        <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            Entrepôt
            <select
              required
              value={form.warehouseId}
              onChange={(event) => setForm({ ...form, warehouseId: event.target.value })}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white"
            >
              <option value="">Choisir un entrepôt disponible</option>
              {availableWarehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.code} — {warehouse.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-300">
            Prénom
            <input
              required
              maxLength={100}
              value={form.firstName}
              onChange={(event) => setForm({ ...form, firstName: event.target.value })}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white"
            />
          </label>
          <label className="text-sm text-slate-300">
            Nom
            <input
              maxLength={100}
              value={form.lastName}
              onChange={(event) => setForm({ ...form, lastName: event.target.value })}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white"
            />
          </label>
          <label className="text-sm text-slate-300">
            E-mail de connexion
            <input
              required
              type="email"
              maxLength={254}
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white"
            />
          </label>
          <label className="text-sm text-slate-300">
            Téléphone
            <input
              type="tel"
              maxLength={40}
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white"
            />
          </label>
          <label className="text-sm text-slate-300">
            Mot de passe temporaire (8 caractères minimum)
            <input
              required
              type="password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white"
            />
          </label>
          <div className="md:col-span-2">
            {availableWarehouses.length === 0 && (
              <p className="mb-3 text-sm text-amber-200">
                Tous les entrepôts actifs ont déjà un chef affecté, ou aucun entrepôt actif
                n’existe.
              </p>
            )}
            <button
              type="submit"
              disabled={busy || availableWarehouses.length === 0}
              className="rounded-xl bg-[#D4AF37] px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
            >
              {busy ? 'Création en cours…' : 'Créer le chef d’entrepôt'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
