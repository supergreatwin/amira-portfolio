import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.1/+esm';

/* Independent browser session from Amira's Editorial Desk client.
   The identity provider is the same existing Supabase project; process access
   is granted only through active, invited edu_members records. */
export const processDb = createClient(
  'https://tfarhghukyogaowjqykn.supabase.co',
  'sb_publishable_ggYvVE1DGcf1EnEQcoKcPg_k_QM9HKS',
  {auth:{
    storageKey:'amira-process-session-v1',
    persistSession:true,
    autoRefreshToken:true,
    detectSessionInUrl:true
  }}
);

export async function identifyProcess(){
  const {data,error}=await processDb.auth.getUser();
  const user=error?null:data?.user;
  if(!user)return {user:null,member:null,staff:false,approved:false};
  const {data:member,error:memberError}=await processDb.from('edu_members')
    .select('user_id,username,display_name,role,is_active').eq('user_id',user.id).maybeSingle();
  if(memberError)throw memberError;
  const approved=Boolean(member?.is_active);
  return {user,member,staff:approved&&member?.role==='instructor',approved};
}

export async function processInvitation(action,fields={}){
  const {data,error}=await processDb.functions.invoke('process-invitations',{
    body:{action,...fields}
  });
  if(error){
    let message=error.message||'Invitation service unavailable.';
    try{
      const data=await error.context?.json?.();
      if(data?.error)message=data.error;
    }catch{}
    throw new Error(message);
  }
  if(!data||data.error||data.ok!==true)throw new Error(data?.error||'Invitation request could not be completed.');
  return data;
}
