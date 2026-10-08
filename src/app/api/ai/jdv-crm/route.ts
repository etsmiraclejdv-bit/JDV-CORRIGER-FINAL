import { NextRequest,NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimitShared,getClientIp } from '@/lib/middleware/rateLimiter';
import { sanitizeString } from '@/lib/security/sanitize';
import { JDV_CRM_KNOWLEDGE } from '@/lib/ai/jdvCrmKnowledge';

type OrgMember={organization_id:string;role:string};
type PageContext={pathname?:string;section?:string};
const safeLike=(value:string)=>value.replace(/[%,()]/g,' ').replace(/'/g,"''").trim().slice(0,80);

export async function POST(req:NextRequest){
 const ip=getClientIp(req);const rl=await checkRateLimitShared('jdv-ai:'+ip,{limit:20,windowMs:15*60*1000});
 if(!rl.allowed)return NextResponse.json({error:'Trop de demandes. Réessayez dans quelques minutes.'},{status:429});
 try{
  const body=await req.json();
  const raw=Array.isArray(body?.messages)?body.messages:[];
  const messages=raw.slice(-12).map((m:any)=>({role:m?.role==='user'?'user':'assistant',content:sanitizeString(m?.content).slice(0,6000)})).filter((m:any)=>m.content);
  if(!messages.length)return NextResponse.json({error:'Question vide.'},{status:400});
  const pageContext:PageContext={pathname:sanitizeString(body?.page_context?.pathname).slice(0,180),section:sanitizeString(body?.page_context?.section).slice(0,120)};
  const lastUser=messages.filter((m:any)=>m.role==='user').at(-1)?.content||'';
  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey)return NextResponse.json({error:'L’assistant IA doit encore être connecté à sa clé IA côté serveur.'},{status:503});

  const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:knowledgeRows}=await admin.from('ai_jdv_knowledge').select('scope,topic,content').eq('active',true).order('scope').order('topic');
  const knowledgeContext=knowledgeRows??[];

  const token=(req.headers.get('authorization')??'').replace(/^Bearer\s+/i,'').trim();
  let liveContext:any={mode:'public',synchronized_at:new Date().toISOString(),page:pageContext};
  if(token){
   const userClient=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{global:{headers:{Authorization:'Bearer '+token}},auth:{autoRefreshToken:false,persistSession:false}});
   const {data:{user}}=await userClient.auth.getUser(token);
   if(user){
    const {data:members}=await admin.from('organization_members').select('organization_id,role').eq('user_id',user.id).eq('status','active');
    const orgIds=[...new Set(((members??[]) as OrgMember[]).map(m=>m.organization_id))];
    if(orgIds.length){
      const primary=orgIds[0];
      const member=(members??[]).find((m:OrgMember)=>m.organization_id===primary);
      const [{data:org},{data:warehouses},{data:subwarehouses},{data:articles},{count:prospectCount},{count:clientCount},{count:saleCount}]=await Promise.all([
        admin.from('organizations').select('id,name,legal_name,country,currency,timezone,status,subscription_status').eq('id',primary).maybeSingle(),
        admin.from('warehouses').select('id,code,name,city,active,manager_user_id').eq('organization_id',primary).order('name').limit(100),
        admin.from('warehouse_subwarehouses').select('id,code,name,parent_warehouse_id,city,zone,active,manager_user_id').in('organization_id',orgIds).order('name').limit(200),
        admin.from('articles').select('id,code,name,description,category,unit,active').in('organization_id',orgIds).eq('active',true).order('updated_at',{ascending:false}).limit(300),
        admin.from('prospects').select('*',{count:'exact',head:true}).in('organization_id',orgIds),
        admin.from('clients').select('*',{count:'exact',head:true}).in('organization_id',orgIds),
        admin.from('sales').select('*',{count:'exact',head:true}).in('organization_id',orgIds)
      ]);
      let articleMatches:any[]=[];
      if(lastUser.length>=3){
        const terms=lastUser.split(/\s+/).map((x:string)=>safeLike(x)).filter((x:string)=>x.length>=3).slice(0,6);
        const filters=terms.flatMap((term:string)=>['code.ilike.%'+term+'%','name.ilike.%'+term+'%']).join(',');
        const {data:matches}=filters?await admin.from('articles').select('id,code,name,description,category,unit,active').in('organization_id',orgIds).eq('active',true).or(filters).limit(20):{data:[]};
        articleMatches=matches??[];
      }
      const articleMap=new Map((articles??[]).map((a:any)=>[a.id,a]));
      const {data:inventory}=await admin.from('warehouse_inventory').select('warehouse_id,subwarehouse_id,article_id,quantity,reserved_quantity,minimum_quantity,updated_at').in('organization_id',orgIds).limit(1000);
      liveContext={
        mode:'authenticated',
        synchronized_at:new Date().toISOString(),
        page:pageContext,
        user:{role:member?.role??'unknown',permissions_hint:member?.role==='business_admin'?'administration complète':member?.role==='manager'||member?.role==='supervisor'?'pilotage opérationnel':'accès limité selon permissions'},
        organization:org??{id:primary},
        warehouses:warehouses??[],
        subwarehouses:subwarehouses??[],
        articles:(articles??[]).map((a:any)=>({code:a.code,name:a.name,description:a.description,category:a.category,unit:a.unit})),
        article_matches:articleMatches.map((a:any)=>({code:a.code,name:a.name,description:a.description,category:a.category,unit:a.unit})),
        inventory:(inventory??[]).slice(0,1000).map((x:any)=>({warehouse_id:x.warehouse_id,subwarehouse_id:x.subwarehouse_id,article:x.article_id?articleMap.get(x.article_id)?.code??null:null,quantity:x.quantity,reserved:x.reserved_quantity,minimum:x.minimum_quantity,updated_at:x.updated_at})),
        counts:{prospects:prospectCount??0,clients:clientCount??0,sales:saleCount??0}
      };
    }
   }
  }

  const system="Tu es l’Agent IA officiel de JDV CRM, formateur, copilote métier, conseiller opérationnel et guide de navigation. Tu dois expliquer le CRM de bout en bout avec une logique progressive et des transitions naturelles. Réponds en français professionnel, clair et pédagogique. Commence par tenir compte de la section actuellement ouverte quand elle est connue. Pour chaque procédure importante : objectif, étapes, contrôles, puis lien vers l’étape suivante. Utilise des transitions comme « Maintenant que cette étape est claire… », « Passons à la suite… », « Une fois cela terminé… ». Pour les articles, aide aussi l’administrateur à comprendre la logique métier : catégorie, unité, usage, gestion du stock, vente, retour et contrôle. Tu peux adapter les exemples au secteur d’activité demandé en t’appuyant sur la base sectorielle, mais tu ne dois jamais inventer une caractéristique technique d’un article qui n’est pas fournie. Le contexte CRM ci-dessous est la source de vérité pour cette réponse. Si une donnée n’y figure pas, dis-le. Ne prétends jamais avoir effectué une action. Ne révèle jamais secrets, clés, données privées ou informations d’une autre organisation. Ne donne pas de données sensibles simplement parce qu’elles existent dans le contexte. Pour les questions publiques, explique le fonctionnement général. Pour les utilisateurs connectés, personnalise selon leur rôle, organisation, entrepôts, sous-entrepôts, articles et indicateurs autorisés. Si l’utilisateur demande quoi faire ensuite, propose l’étape suivante la plus logique dans son parcours. Si tu détectes une donnée manquante ou incohérente dans le contexte, signale-la clairement comme point à vérifier au lieu de l’inventer. Pour une action sensible, donne la procédure et les contrôles requis mais ne simule jamais l’exécution. Base fonctionnelle: "+JSON.stringify(JDV_CRM_KNOWLEDGE)+" Base de connaissances sectorielle et modules: "+JSON.stringify(knowledgeContext)+" Contexte CRM synchronisé à l’instant: "+JSON.stringify(liveContext);

  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-6-luna',instructions:system,input:messages})});
  const json=await response.json();
  if(!response.ok)return NextResponse.json({error:json?.error?.message||'Le service IA est indisponible.'},{status:502});
  return NextResponse.json({content:json.output_text||'Je n’ai pas pu produire une réponse. Pouvez-vous reformuler votre question ?',synchronized_at:liveContext.synchronized_at});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erreur inattendue.'},{status:500})}
}