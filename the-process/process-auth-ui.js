import { processDb, identifyProcess, processInvitation, processRecoveryPending, processRecoveryAuth, clearProcessRecovery } from './process-auth-core.js';

const $=id=>document.getElementById(id);
const modes=['signin','signup','claim','forgot','password'];
const url=new URL(window.location.href);
const invitationCode=url.searchParams.get('invite')||'';
const invitationEmail=url.searchParams.get('email')||'';
let onAccepted=null;
let busy=false;
let currentMode='signin';

function message(text,error=false){
  const el=$('process-auth-status');
  if(!el)return;
  el.textContent=text||'';
  el.classList.toggle('is-error',!!error);
}
function mode(name){
  currentMode=name;
  for(const x of modes) {const f=$('process-'+x+'-form');if(f)f.hidden=x!==name;}
  for(const tab of document.querySelectorAll('[data-process-auth-mode]')){
    const selected=tab.dataset.processAuthMode===name;
    tab.setAttribute('aria-selected',String(selected));
    tab.classList.toggle('active',selected);
  }
  $('process-auth-tabs').hidden=!['signin','signup'].includes(name);
  message('');
}
function setBusy(active){
  busy=active;
  document.querySelectorAll('#process-auth-screen button, #process-auth-screen input').forEach(el=>el.disabled=active);
}
async function approved(){
  if(processRecoveryPending)return false;
  const identity=await identifyProcess();
  if(!identity.approved)return false;
  $('process-auth-screen').hidden=true;
  $('main').hidden=false;
  await onAccepted(identity);
  return true;
}
async function redeem(code){
  if(!/^[a-f0-9]{64}$/i.test(code))throw new Error('Enter the full invitation code from your invitation link.');
  await processInvitation('redeem',{code:code.toLowerCase()});
  if(!await approved())throw new Error('Your membership could not be confirmed. Contact Amira for assistance.');
  message('');
}
async function afterSignIn(){
  if(await approved())return;
  const id=await identifyProcess();
  if(!id.user)return mode('signin');
  mode('claim');
  const code=$('process-claim-code').value.trim();
  if(code){
    try {await redeem(code);return;}
    catch(e){message(e.message,true);}
  }else message('Account signed in. Enter your invitation code to activate access.');
}

function setup(){
  for(const tab of document.querySelectorAll('[data-process-auth-mode]')){
    tab.addEventListener('click',()=>mode(tab.dataset.processAuthMode));
  }
  for(const toggle of document.querySelectorAll('[data-process-auth-go]')){
    toggle.addEventListener('click',()=>mode(toggle.dataset.processAuthGo));
  }
  if(invitationEmail){
    $('process-signup-email').value=invitationEmail;
    $('process-signin-email').value=invitationEmail;
  }
  if(invitationCode){
    $('process-signup-invite').value=invitationCode;
    $('process-claim-code').value=invitationCode;
  }
  $('process-signin-form').addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    setBusy(true);
    try{
      const email=$('process-signin-email').value.trim().toLowerCase();
      const password=$('process-signin-password').value;
      const {error}=await processDb.auth.signInWithPassword({email,password});
      if(error)throw error;
      await afterSignIn();
    }catch(error){message(error.message||'Unable to sign in.',true);}
    finally{setBusy(false);}
  });
  $('process-signup-form').addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    const full_name=$('process-signup-name').value.trim();
    const email=$('process-signup-email').value.trim().toLowerCase();
    const code=$('process-signup-invite').value.trim().toLowerCase();
    const password=$('process-signup-password').value;
    const confirm=$('process-signup-confirm').value;
    if(password!==confirm){message('The passwords do not match.',true);return;}
    if(password.length<10){message('Use a password of at least 10 characters.',true);return;}
    if(!/^[a-f0-9]{64}$/.test(code)){message('A valid invitation link or invitation code is required.',true);return;}
    setBusy(true);
    try{
      await processInvitation('validate',{email,code});
      const redirectTo=new URL('./',window.location.href);
      redirectTo.search='?invite='+encodeURIComponent(code)+'&email='+encodeURIComponent(email);
      redirectTo.hash='';
      const {data,error}=await processDb.auth.signUp({
        email,password,options:{
          emailRedirectTo:redirectTo.href,
          data:{full_name}
        }
      });
      if(error)throw error;
      $('process-claim-code').value=code;
      if(data?.session){
        await afterSignIn();
      }else{
        mode('signin');
        $('process-signin-email').value=email;
        message('Check your email to verify your account. After verification, return through your invitation link to activate access.');
      }
    }catch(error){message(error.message||'Account creation failed.',true);}
    finally{setBusy(false);}
  });
  $('process-claim-form').addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    setBusy(true);
    try{await redeem($('process-claim-code').value.trim());}
    catch(error){message(error.message||'Invitation could not be activated.',true);}
    finally{setBusy(false);}
  });
  $('process-claim-signout').addEventListener('click',async()=>{
    await processDb.auth.signOut({scope:'local'});mode('signin');
    message('Signed out of The Process. Your Editorial Desk session has not been changed.');
  });
  $('process-forgot-form').addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    setBusy(true);
    try{
      const email=$('process-forgot-email').value.trim().toLowerCase();
      const response=await fetch('https://tfarhghukyogaowjqykn.supabase.co/functions/v1/request-password-reset',{
        method:'POST',headers:{'Content-Type':'application/json',apikey:'sb_publishable_ggYvVE1DGcf1EnEQcoKcPg_k_QM9HKS'},
        body:JSON.stringify({email,platform:'process'})
      });
      if(!response.ok)throw Error('Reset request unavailable');
      message('If this email belongs to an account, a password-reset link will arrive shortly.');
    }catch{message('Unable to request a reset right now. Please try again later.',true);}
    finally{setBusy(false);}
  });
  $('process-password-form').addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    const password=$('process-new-password').value;
    if(password.length<10||password!==$('process-new-password-confirm').value){
      message('Enter a matching password of at least 10 characters.',true);return;
    }
    setBusy(true);
    try{
      if(!processRecoveryPending)throw Error('Use a fresh password-reset link.');
      const auth=processRecoveryAuth();
      const {data,error:sessionError}=await auth.getSession();
      if(sessionError||!data?.session)throw Error('This reset link is invalid or expired.');
      const {error}=await auth.updateUser({password});
      if(error)throw error;
      await auth.signOut({scope:'local'});
      await processDb.auth.signOut({scope:'local'});
      clearProcessRecovery();
      $('process-password-form').reset();mode('signin');
      message('Password changed. Sign in with your new password.');
    }catch(error){message(error.message||'Could not update the password.',true);}
    finally{setBusy(false);}
  });
  $('process-cancel-recovery').addEventListener('click',async()=>{
    await processRecoveryAuth().signOut({scope:'local'});
    await processDb.auth.signOut({scope:'local'});
    clearProcessRecovery();mode('signin');
    message('Password recovery cancelled. You can sign in normally.');
  });
  $('process-invite-form')?.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    const submit=$('process-invite-submit');
    submit.disabled=true;
    $('process-invite-status').textContent='';
    try{
      const email=$('process-invite-email').value.trim().toLowerCase();
      const result=await processInvitation('issue',{email});
      const field=$('process-issued-link');
      field.value=result.url;
      $('process-issued-wrap').hidden=false;
      $('process-invite-status').textContent='Single-use link created; expires in seven days. Share privately with the intended recipient.';
    }catch(error){$('process-invite-status').textContent=error.message||'Unable to issue invitation.';}
    finally{submit.disabled=false;}
  });
  $('process-copy-invite')?.addEventListener('click',async()=>{
    const field=$('process-issued-link');
    try{
      await navigator.clipboard.writeText(field.value);
      $('process-invite-status').textContent='Invitation link copied.';
    }catch{
      field.focus();field.select();
      $('process-invite-status').textContent='Copy the selected invitation link.';
    }
  });
  processDb.auth.onAuthStateChange((event)=>{
    if(event==='PASSWORD_RECOVERY')queueMicrotask(()=>{
      $('process-auth-screen').hidden=false;
      $('main').hidden=true;
      mode('password');
    });
  });
}
export async function mountProcessAuth(callback){
  onAccepted=callback;
  setup();
  if(processRecoveryPending){
    mode('password');
    processRecoveryAuth();
    return;
  }
  else if(invitationCode)mode('signup');
  else mode('signin');
  try{
    const id=await identifyProcess();
    if(id.approved)await approved();
    else if(id.user){
      mode('claim');
      message('This account needs an invitation before it can enter The Process.');
    }
  }catch(error){
    mode('signin');
    message('Could not verify your session. Please try signing in again.',true);
  }
}
