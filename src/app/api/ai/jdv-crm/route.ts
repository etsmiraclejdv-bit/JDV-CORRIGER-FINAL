import { NextRequest,NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimitShared,getClientIp } from '@/lib/middleware/rateLimiter';
import { sanitizeString } from '@/lib/security/sanitize';
import { JDV_CRM_KNOWLEDGE } from '@/lib/ai/jdvCrmKnowledge';

export async function POST(req:NextRequest){
 const ip=getClientIp(req);const rl=await checkRateLimitShared('jdv-ai:'+ip,{limit:20,windowMs:15*60*1000});
 if(!rl.allowed)return NextResponse.json({error:'Trop de demandes. Réessayez dans quelques minutes.'},{status:429});
 try{
  const body=await req.json();const raw=Array.isArray(body?.messages)?body.messages:[];const messages=raw.slice(-12).map((m:any)=>({role:m?.role==='user'?'user':'assistant',content:sanitizeString(m?.content).slice(0,6000)})).filter((m:any)=>m.content);
  if(!messages.length)return NextResponse.json({error:'Question vide.'},{status:400});
  const apiKey=process.env.OPENAI_API_KEY;if(!apiKey)return NextResponse.json({error:'L’assistant IA doit encore être connecté à sa clé IA côté serveur.'},{status:503});
  let articleContext='Aucun catalogue privé n’est disponible dans cette session.';
  const token=(req.headers.get('authorization')??'').replace(/^Bearer\s+/i,'').trim();
  if(token){
   const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
   const userClient=createClient(url,anon,{global:{headers:{Authorization:'Bearer '+token}},auth:{autoRefreshToken:false,persistSession:false}});
   const {data:{user}}=await userClient.auth.getUser(token);
   if(user){
    const admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{autoRefreshToken:false,persistSession:false}});
    const {data:members}=await admin.from('organization_members').select('organization_id,role').eq('user_id',user.id).eq('status','active');
    const orgIds=(members??[]).map((m:any)=>m.organization_id);
    if(orgIds.length){const {data:articles}=await admin.from('articles').select('code,name,description,category,unit,active,organization_id').in('organization_id',orgIds).eq('active',true).limit(150);articleContext=JSON.stringify((articles??[]).map((a:any)=>({code:a.code,name:a.name,description:a.description,category:a.category,unit:a.unit})));}
   }
  }
  const system="Tu es l’Agent IA officiel de JDV CRM. Tu es un formateur, copilote métier et guide de navigation. Tu connais le CRM de bout en bout et aides à comprendre quoi faire, pourquoi, dans quel ordre et quel résultat attendre. Réponds en français. Utilise des transitions naturelles comme « Maintenant que cette étape est claire… », « Passons à la suite… », « Une fois cela terminé… », « Pour aller plus loin… ». Ne prétends jamais avoir cliqué ou modifié une donnée si tu ne l’as pas réellement fait. Ne révèle jamais de secrets, clés, données privées ou informations d’une autre organisation. Pour les articles privés, utilise uniquement le catalogue autorisé ci-dessous et n’invente aucune caractéristique technique. Quand une question touche plusieurs modules, relie-les explicitement. Quand une question demande l’usage d’une section, donne objectif, étapes, contrôles et lien avec l’étape suivante. Base JDV CRM: "+JSON.stringify(JDV_CRM_KNOWLEDGE)+" Catalogue autorisé: "+articleContext;
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-6-luna',instructions:system,input:messages})});
  const json=await response.json();if(!response.ok)return NextResponse.json({error:json?.error?.message||'Le service IA est indisponible.'},{status:502});
  return NextResponse.json({content:json.output_text||'Je n’ai pas pu produire une réponse. Pouvez-vous reformuler votre question ?'});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erreur inattendue.'},{status:500})}
}