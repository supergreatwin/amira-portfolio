import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.1/+esm';

const RECOVERY_KEY='amira-process-recovery-pending-v1';
const address=new URL(location.href);
export let processRecoveryPending=address.searchParams.has('recover') || new URLSearchParams(address.hash.slice(1)).get('type')==='recovery';
try{processRecoveryPending=processRecoveryPending||sessionStorage.getItem(RECOVERY_KEY)==='1';}catch{}
let recoveryClient;
export function processRecoveryAuth(){
  processRecoveryPending=true;
  try{sessionStorage.setItem(RECOVERY_KEY,'1');}catch{}
  recoveryClient ||= createClient('https://tfarhghukyogaowjqykn.supabase.co','sb_publishable_ggYvVE1DGcf1EnEQcoKcPg_k_QM9HKS',{
    auth:{storageKey:'amira-process-recovery-memory-v1',persistSession:false,autoRefreshToken:false,detectSessionInUrl:true}
  });
  return recoveryClient.auth;
}
export function clearProcessRecovery(){
  processRecoveryPending=false;
  try{sessionStorage.removeItem(RECOVERY_KEY);}catch{}
  const clean=new URL(location.href);clean.searchParams.delete('recover');clean.hash='';
  history.replaceState(null,'',clean.pathname+clean.search);
}

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
    detectSessionInUrl:!processRecoveryPending
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
