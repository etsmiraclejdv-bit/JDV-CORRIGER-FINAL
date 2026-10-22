'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { Plus, Settings2, Percent, Wallet, Trash2 } from 'lucide-react';

type Type = {
  id: string;
  name: string;
  code: string | null;
  calculation_method: 'percentage' | 'fixed' | 'per_unit';
  active: boolean;
};
type Article = { id: string; name: string; code: string; category: string | null };
type Rule = {
  id: string;
  name: string;
  scope: string;
  priority: number;
  rate_percent: number | null;
  fixed_amount: number | null;
  per_unit_amount: number | null;
  cumulative: boolean;
  active: boolean;
  commission_types?: { name: string; calculation_method: string } | null;
  articles?: { name: string; code: string } | null;
  category_name: string | null;
};

export default function CommissionsPage() {
  const { t } = useLanguage();
  const [orgId, setOrgId] = useState('');
  const [types, setTypes] = useState<Type[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [typeForm, setTypeForm] = useState({
    name: '',
    code: '',
    description: '',
    calculation_method: 'percentage',
  });
  const [ruleForm, setRuleForm] = useState({
    name: '',
    commission_type_id: '',
    scope: 'organization',
    article_id: '',
    category_name: '',
    priority: 100,
    rate_percent: '',
    fixed_amount: '',
    per_unit_amount: '',
    cumulative: false,
    applies_to_sale_type: 'both',
  });
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    const auth = await supabase.auth.getUser();
    const user = auth.data.user;
    if (!user) {
      setMessage(t('bz.cmSession'));
      setLoading(false);
      return;
    }
    const memberResult = await supabase
      .from('organization_members')
      .select('organization_id,role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['business_admin', 'manager'])
      .limit(1)
      .maybeSingle();
    const member = memberResult.data;
    if (memberResult.error || !member) {
      setMessage(t('bz.cmDenied'));
      setLoading(false);
      return;
    }
    setOrgId(member.organization_id);
    const [ty, a, r] = await Promise.all([
      supabase
        .from('commission_types')
        .select('id,name,code,calculation_method,active')
        .eq('organization_id', member.organization_id)
        .order('name'),
      supabase
        .from('articles')
        .select('id,name,code,category')
        .eq('organization_id', member.organization_id)
        .order('name'),
      supabase
        .from('commission_rules')
        .select(
          'id,name,scope,priority,rate_percent,fixed_amount,per_unit_amount,cumulative,active,category_name,commission_types(name,calculation_method),articles(name,code)'
        )
        .eq('organization_id', member.organization_id)
        .order('priority', { ascending: false })
        .order('created_at'),
    ]);
    if (ty.error || a.error || r.error) {
      setMessage(ty.error?.message || a.error?.message || r.error?.message || t('bz.cmLoadErr'));
    }
    setTypes((ty.data || []) as Type[]);
    setArticles((a.data || []) as Article[]);
    const normalizedRules = (r.data ?? []).map((row) => {
      const record = row as unknown as Record<string, unknown>;
      const commissionTypes = record.commission_types;
      const articlesRelation = record.articles;
      return {
        ...record,
        commission_types: Array.isArray(commissionTypes)
          ? (commissionTypes[0] ?? null)
          : (commissionTypes ?? null),
        articles: Array.isArray(articlesRelation)
          ? (articlesRelation[0] ?? null)
          : (articlesRelation ?? null),
      };
    });
    setRules(normalizedRules as unknown as Rule[]);
    if (!ruleForm.commission_type_id && ty.data && ty.data[0])
      setRuleForm(function (x) {
        return { ...x, commission_type_id: ty.data![0].id };
      });
    setLoading(false);
  }
  useEffect(function () {
    load();
  }, []);

  async function createType(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId || !typeForm.name.trim()) return;
    setSaving(true);
    setMessage('');
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from('commission_types').insert({
      organization_id: orgId,
      name: typeForm.name.trim(),
      code: typeForm.code.trim() || null,
      description: typeForm.description.trim() || null,
      calculation_method: typeForm.calculation_method,
      created_by: user?.id,
    });
    setSaving(false);
    setMessage(error ? error.message : t('bz.cmTypeOk'));
    if (!error) {
      setTypeForm({ name: '', code: '', description: '', calculation_method: 'percentage' });
      load();
    }
  }

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId || !ruleForm.name.trim() || !ruleForm.commission_type_id) return;
    setSaving(true);
    setMessage('');
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from('commission_rules').insert({
      organization_id: orgId,
      name: ruleForm.name.trim(),
      commission_type_id: ruleForm.commission_type_id,
      scope: ruleForm.scope,
      article_id: ruleForm.scope === 'article' ? ruleForm.article_id : null,
      category_name: ruleForm.scope === 'category' ? ruleForm.category_name.trim() : null,
      priority: Number(ruleForm.priority) || 100,
      rate_percent: ruleForm.rate_percent === '' ? null : Number(ruleForm.rate_percent),
      fixed_amount: ruleForm.fixed_amount === '' ? null : Number(ruleForm.fixed_amount),
      per_unit_amount: ruleForm.per_unit_amount === '' ? null : Number(ruleForm.per_unit_amount),
      cumulative: ruleForm.cumulative,
      applies_to_sale_type: ruleForm.applies_to_sale_type,
      created_by: user?.id,
    });
    setSaving(false);
    setMessage(error ? error.message : t('bz.cmRuleOk'));
    if (!error) {
      setRuleForm(function (x) {
        return {
          ...x,
          name: '',
          article_id: '',
          category_name: '',
          rate_percent: '',
          fixed_amount: '',
          per_unit_amount: '',
        };
      });
      load();
    }
  }

  async function toggleRule(id: string, active: boolean) {
    await supabase.from('commission_rules').update({ active: !active }).eq('id', id);
    load();
  }
  async function deleteRule(id: string) {
    if (!confirm(t('bz.cmDelQ'))) return;
    await supabase.from('commission_rules').delete().eq('id', id);
    load();
  }

  if (loading) return <div className="p-8 text-white">{t('bz.cmLoading')}</div>;

  return (
    <div className="p-6 space-y-6 text-white">
      <div>
        <h1 className="text-2xl font-bold">{t('bz.cmTitle')}</h1>
        <p className="text-slate-400 mt-1">{t('bz.cmIntro')}</p>
      </div>
      {message && (
        <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3 text-sm">
          {message}
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-white/10 bg-[#08152f] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 size={18} />
            <h2 className="font-semibold">{t('bz.cmTypes')}</h2>
          </div>
          <form onSubmit={createType} className="space-y-3">
            <input
              className="w-full rounded-lg bg-[#0F2347] border border-white/10 p-2.5"
              placeholder={t('bz.cmTypePh')}
              value={typeForm.name}
              onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className="rounded-lg bg-[#0F2347] border border-white/10 p-2.5"
                placeholder={t('bz.cmCodePh')}
                value={typeForm.code}
                onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
              />
              <select
                className="rounded-lg bg-[#0F2347] border border-white/10 p-2.5"
                value={typeForm.calculation_method}
                onChange={(e) => setTypeForm({ ...typeForm, calculation_method: e.target.value })}
              >
                <option value="percentage">{t('bz.cmMPct')}</option>
                <option value="fixed">{t('bz.cmMFixed')}</option>
                <option value="per_unit">{t('bz.cmMUnit')}</option>
              </select>
            </div>
            <input
              className="w-full rounded-lg bg-[#0F2347] border border-white/10 p-2.5"
              placeholder={t('bz.cmDesc')}
              value={typeForm.description}
              onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
            />
            <button
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] text-[#08152f] font-semibold px-4 py-2"
            >
              <Plus size={16} />
              {t('bz.cmCreateType')}
            </button>
          </form>
          <div className="mt-5 space-y-2">
            {types.map((ty) => (
              <div
                key={ty.id}
                className="flex items-center justify-between rounded-lg bg-[#0F2347] p-3 text-sm"
              >
                <span>{ty.name}</span>
                <span className="text-slate-400">{ty.calculation_method}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#08152f] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Percent size={18} />
            <h2 className="font-semibold">{t('bz.cmNewRule')}</h2>
          </div>
          <form onSubmit={createRule} className="space-y-3">
            <input
              required
              className="w-full rounded-lg bg-[#0F2347] border border-white/10 p-2.5"
              placeholder={t('bz.cmRuleName')}
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
            />
            <select
              required
              className="w-full rounded-lg bg-[#0F2347] border border-white/10 p-2.5"
              value={ruleForm.commission_type_id}
              onChange={(e) => setRuleForm({ ...ruleForm, commission_type_id: e.target.value })}
            >
              {types.map((ty) => (
                <option key={ty.id} value={ty.id}>
                  {ty.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select
                className="rounded-lg bg-[#0F2347] border border-white/10 p-2.5"
                value={ruleForm.scope}
                onChange={(e) => setRuleForm({ ...ruleForm, scope: e.target.value })}
              >
                <option value="organization">{t('bz.cmScopeOrg')}</option>
                <option value="article">{t('bz.cmScopeArt')}</option>
                <option value="category">{t('bz.cmScopeCat')}</option>
              </select>
              <input
                type="number"
                className="rounded-lg bg-[#0F2347] border border-white/10 p-2.5"
                placeholder={t('bz.cmPriority')}
                value={ruleForm.priority}
                onChange={(e) => setRuleForm({ ...ruleForm, priority: Number(e.target.value) })}
              />
            </div>
            {ruleForm.scope === 'article' && (
              <select
                required
                className="w-full rounded-lg bg-[#0F2347] border border-white/10 p-2.5"
                value={ruleForm.article_id}
                onChange={(e) => setRuleForm({ ...ruleForm, article_id: e.target.value })}
              >
                <option value="">{t('bz.cmPickArt')}</option>
                {articles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </select>
            )}
            {ruleForm.scope === 'category' && (
              <input
                required
                className="w-full rounded-lg bg-[#0F2347] border border-white/10 p-2.5"
                placeholder={t('bz.cmCatPh')}
                value={ruleForm.category_name}
                onChange={(e) => setRuleForm({ ...ruleForm, category_name: e.target.value })}
              />
            )}
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                step="0.0001"
                className="rounded-lg bg-[#0F2347] border border-white/10 p-2.5"
                placeholder={t('bz.cmRatePh')}
                value={ruleForm.rate_percent}
                onChange={(e) => setRuleForm({ ...ruleForm, rate_percent: e.target.value })}
              />
              <input
                type="number"
                step="0.01"
                className="rounded-lg bg-[#0F2347] border border-white/10 p-2.5"
                placeholder={t('bz.cmMFixed')}
                value={ruleForm.fixed_amount}
                onChange={(e) => setRuleForm({ ...ruleForm, fixed_amount: e.target.value })}
              />
              <input
                type="number"
                step="0.01"
                className="rounded-lg bg-[#0F2347] border border-white/10 p-2.5"
                placeholder={t('bz.cmMUnit')}
                value={ruleForm.per_unit_amount}
                onChange={(e) => setRuleForm({ ...ruleForm, per_unit_amount: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                className="rounded-lg bg-[#0F2347] border border-white/10 p-2.5"
                value={ruleForm.applies_to_sale_type}
                onChange={(e) => setRuleForm({ ...ruleForm, applies_to_sale_type: e.target.value })}
              >
                <option value="both">{t('bz.cmSaleBoth')}</option>
                <option value="cash">{t('bz.cmSaleCash')}</option>
                <option value="credit">{t('bz.cmSaleCredit')}</option>
              </select>
              <label className="flex items-center gap-2 rounded-lg bg-[#0F2347] p-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={ruleForm.cumulative}
                  onChange={(e) => setRuleForm({ ...ruleForm, cumulative: e.target.checked })}
                />{' '}
                {t('bz.cmCumul')}
              </label>
            </div>
            <button
              disabled={saving || types.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] text-[#08152f] font-semibold px-4 py-2"
            >
              <Plus size={16} />
              {t('bz.cmAddRule')}
            </button>
          </form>
        </section>
      </div>
      <section className="rounded-2xl border border-white/10 bg-[#08152f] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={18} />
          <h2 className="font-semibold">{t('bz.cmRules')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10">
                <th className="p-2">{t('bz.cmColRule')}</th>
                <th className="p-2">{t('bz.cmColScope')}</th>
                <th className="p-2">{t('bz.cmColCalc')}</th>
                <th className="p-2">{t('bz.cmPriority')}</th>
                <th className="p-2">{t('bz.cmColState')}</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="p-2">
                    {r.name}
                    <div className="text-xs text-slate-500">{r.commission_types?.name}</div>
                  </td>
                  <td className="p-2">
                    {r.scope === 'article'
                      ? r.articles?.name || t('bz.cmScopeArt')
                      : r.scope === 'category'
                        ? r.category_name || t('bz.cmScopeCat')
                        : t('bz.cmScopeOrg')}
                  </td>
                  <td className="p-2">
                    {r.rate_percent != null
                      ? String(r.rate_percent) + '%'
                      : r.fixed_amount != null
                        ? String(r.fixed_amount)
                        : String(r.per_unit_amount || 0) + t('bz.cmPerUnitSfx')}
                  </td>
                  <td className="p-2">{r.priority}</td>
                  <td className="p-2">
                    <button onClick={() => toggleRule(r.id, r.active)} className="text-[#D4AF37]">
                      {r.active ? t('bz.cmActive') : t('bz.cmInactive')}
                    </button>
                  </td>
                  <td className="p-2 text-right">
                    <button onClick={() => deleteRule(r.id)} className="text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
