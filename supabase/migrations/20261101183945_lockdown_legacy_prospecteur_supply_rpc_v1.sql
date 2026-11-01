-- JDV CRM — durcissement du flux d'approvisionnement prospecteur.
-- La nouvelle interface utilise jdvcrm_create_prospecteur_supply_request_v1.
-- L'ancien RPC mutatif ne doit plus être appelable par les sessions utilisateur.
-- Cette migration est proposée dans une branche de revue : ne pas appliquer en production
-- avant validation des usages et tests sur une base de test.

revoke all on function public.jdvcrm_request_prospecteur_supply_v1(uuid, jsonb)
  from public, anon, authenticated;

-- Conserver l'accès service_role pour les opérations administratives explicites,
-- tout en interdisant l'appel direct depuis les sessions authentifiées.
grant execute on function public.jdvcrm_request_prospecteur_supply_v1(uuid, jsonb)
  to service_role;

comment on function public.jdvcrm_request_prospecteur_supply_v1(uuid, jsonb)
  is 'Legacy mutating RPC: execution restricted to service_role; user sessions must use jdvcrm_create_prospecteur_supply_request_v1.';
