import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.119.1";

const projectUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const admin = createClient(projectUrl, serviceKey, { auth:{persistSession:false,autoRefreshToken:false} });
const origins = new Set([
  "https://amiraabdelfadil.com",
  "https://www.amiraabdelfadil.com",
  "https://amiraabdelfadil.pages.dev",
  "https://amira-portfolio-ds4.pages.dev",
  "https://supergreatwin.github.io"
]);
function cors(req:Request):Record<string,string>{
  const origin=req.headers.get("origin")||"";
  return {
    "Access-Control-Allow-Origin":origins.has(origin)?origin:"https://amiraabdelfadil.com",
    "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
    "Access-Control-Allow-Methods":"POST,OPTIONS",
    "Vary":"Origin",
    "Cache-Control":"no-store"
  };
}
function reply(req:Request,obj:unknown,status=200){
  return new Response(JSON.stringify(obj),{status,headers:{"Content-Type":"application/json; charset=utf-8",...cors(req)}});
}
function validEmail(x:unknown):x is string{
  return typeof x==="string" && x.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
}
function validCode(x:unknown):x is string{
  return typeof x==="string"&&/^[a-f0-9]{64}$/i.test(x);
}
async function hash(code:string){
  const bytes=new TextEncoder().encode(code.toLowerCase());
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,"0")).join("");
}
async function actor(req:Request){
  const header=req.headers.get("Authorization")||"";
  const token=/^Bearer\s+(.+)$/i.exec(header)?.[1];
  if(!token||token===serviceKey)return null;
  const {data,error}=await admin.auth.getUser(token);
  return error?null:data.user||null;
}
Deno.serve(async (req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST")return reply(req,{error:"Method not allowed"},405);
  if(!projectUrl||!serviceKey)return reply(req,{error:"Service unavailable"},503);
  let body:Record<string,unknown>;
  try { body=await req.json(); if(!body||typeof body!=="object"||Array.isArray(body))throw 0; }
  catch {return reply(req,{error:"Invalid request"},400);}
  const action=body.action;

  if(action==="validate"){
    if(!validEmail(body.email)||!validCode(body.code))return reply(req,{error:"Invalid or expired invitation"},403);
    const codeHash=await hash(body.code);
    const {data,error}=await admin.from("process_invitations")
      .select("id").eq("code_hash",codeHash)
      .eq("email",body.email.trim().toLowerCase())
      .is("used_at",null).is("revoked_at",null)
      .gt("expires_at",new Date().toISOString()).limit(1);
    if(error)return reply(req,{error:"Invitation check unavailable"},503);
    if(!data?.length)return reply(req,{error:"Invalid or expired invitation"},403);
    return reply(req,{ok:true});
  }

  const user=await actor(req);
  if(!user)return reply(req,{error:"Sign in to The Process first"},401);

  if(action==="issue"){
    const email=validEmail(body.email)?body.email.trim().toLowerCase():"";
    if(!email)return reply(req,{error:"Provide a valid email address"},400);
    const {data:member,error:memberError}=await admin.from("edu_members")
      .select("role,is_active").eq("user_id",user.id).maybeSingle();
    if(memberError || member?.role!=="instructor" || !member.is_active)
      return reply(req,{error:"Only a Process instructor can invite members"},403);
    const since=new Date(Date.now()-24*3600*1000).toISOString();
    const {count,error:countError}=await admin.from("process_invitations")
      .select("id",{count:"exact",head:true}).eq("invited_by",user.id).gte("created_at",since);
    if(countError)return reply(req,{error:"Invite limit check unavailable"},503);
    if((count||0)>=30)return reply(req,{error:"Daily invitation limit reached"},429);
    const bytes=crypto.getRandomValues(new Uint8Array(32));
    const inviteCode=[...bytes].map(n=>n.toString(16).padStart(2,"0")).join("");
    const expiresAt=new Date(Date.now()+7*24*3600*1000).toISOString();
    const {error}=await admin.from("process_invitations").insert({
      email,code_hash:await hash(inviteCode),invited_by:user.id,expires_at:expiresAt
    });
    if(error)return reply(req,{error:"Could not create this invitation"},500);
    const url="https://amiraabdelfadil.com/the-process/?invite="+encodeURIComponent(inviteCode)+"&email="+encodeURIComponent(email);
    return reply(req,{ok:true,url,expires_at:expiresAt});
  }

  if(action==="redeem"){
    if(!validCode(body.code))return reply(req,{error:"Invalid or expired invitation"},403);
    if(!user.email_confirmed_at)return reply(req,{error:"Verify your email address before activating your invitation"},403);
    const {data,error}=await admin.rpc("process_claim_invitation",{p_user_id:user.id,p_code_hash:await hash(body.code)});
    if(error)return reply(req,{error:"Could not activate your invitation"},503);
    if(data!==true)return reply(req,{error:"Invalid, used, or expired invitation. Verify you signed up with the invited email."},403);
    return reply(req,{ok:true});
  }
  return reply(req,{error:"Unknown action"},400);
});
