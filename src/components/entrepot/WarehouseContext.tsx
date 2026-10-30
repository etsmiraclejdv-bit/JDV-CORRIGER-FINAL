'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getAuthContext } from '@/lib/auth/context';

export type MyWarehouse = {
  warehouse_id: string;
  organization_id: string;
  code: string;
  name: string;
  city: string | null;
  active: boolean;
  access_role: 'admin' | 'manager';
};
type WarehouseCtx = {
  warehouses: MyWarehouse[];
  current: MyWarehouse | null;
  setCurrentId: (id: string) => void;
  loading: boolean;
  error: string | null;
  reload: () => void;
};
const Ctx = createContext<WarehouseCtx>({
  warehouses: [],
  current: null,
  setCurrentId: () => {},
  loading: true,
  error: null,
  reload: () => {},
});
const STORAGE_KEY = 'jdv_entrepot_courant';

export function WarehouseProvider({
  children,
  requiredRole,
  allowSuperAdmin = false,
}: {
  children: React.ReactNode;
  requiredRole?: MyWarehouse['access_role'];
  allowSuperAdmin?: boolean;
}) {
  const [warehouses, setWarehouses] = useState<MyWarehouse[]>([]);
  const [currentId, setCurrentIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [access, { data, error: err }] = await Promise.all([
      allowSuperAdmin ? getAuthContext() : Promise.resolve(null),
      supabase.rpc('jdvcrm_my_warehouses_v1'),
    ]);
    if (err) {
      setError(err.message);
      setWarehouses([]);
    } else {
      const list = ((data ?? []) as MyWarehouse[]).filter(
        (w) =>
          w.active &&
          (!requiredRole ||
            w.access_role === requiredRole ||
            (allowSuperAdmin && access?.isSuperAdmin && w.access_role === 'admin'))
      );
      setWarehouses(list);
      let saved: string | null = null;
      try {
        saved = window.localStorage.getItem(STORAGE_KEY);
      } catch {
        saved = null;
      }
      setCurrentIdState((prev) => {
        const wanted = prev ?? saved;
        return (
          list.find((w) => w.warehouse_id === wanted)?.warehouse_id ?? list[0]?.warehouse_id ?? null
        );
      });
    }
    setLoading(false);
  }, [allowSuperAdmin, requiredRole]);
  useEffect(() => {
    load();
  }, [load]);
  const setCurrentId = useCallback((id: string) => {
    setCurrentIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* localStorage may be unavailable in restricted contexts. */
    }
  }, []);
  const value = useMemo<WarehouseCtx>(
    () => ({
      warehouses,
      current: warehouses.find((w) => w.warehouse_id === currentId) ?? null,
      setCurrentId,
      loading,
      error,
      reload: load,
    }),
    [warehouses, currentId, setCurrentId, loading, error, load]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useWarehouse() {
  return useContext(Ctx);
}
