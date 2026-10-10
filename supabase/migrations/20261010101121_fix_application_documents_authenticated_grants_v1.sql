-- Les candidats doivent pouvoir envoyer et lire leurs documents (la sécurité reste assurée par RLS et les verrous).
grant select, insert on public.organization_application_documents to authenticated;
