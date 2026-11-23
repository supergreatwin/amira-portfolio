import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.1/+esm';
import { recoveryTokens, passwordProblem } from './editorial-auth-core.js';

const $ = id => document.getElementById(id);
const ar = document.body.dataset.locale === 'ar';
const msg = (en, arabic) => ar ? arabic : en;
const form = $('ed-recover-form');
const submit = form.querySelector('button[type="submit"]');
const tokens = recoveryTokens(window.location.href);
// Remove credentials before initializing Auth. This page loads no analytics.
window.history.replaceState(null, '', window.location.pathname);
const recovery = createClient(
  'https://tfarhghukyogaowjqykn.supabase.co',
  'sb_publishable_ggYvVE1DGcf1EnEQcoKcPg_k_QM9HKS',
  { auth: {
    storageKey: 'amira-editorial-recovery-v1',
    persistSession: false, autoRefreshToken: false, detectSessionInUrl: false
  } }
);
let ready = false;
let pending = false;
function notice(text) { $('ed-message').textContent = text; }
function invalidLink() {
  ready = false;
  form.hidden = true;
  notice(msg('This reset link is invalid, expired or already used. Return to sign in and request a new reset email.',
    'رابط إعادة التعيين غير صالح أو انتهت صلاحيته أو استُخدم من قبل. عودي إلى تسجيل الدخول واطلبي رسالة جديدة.'));
}
async function initialize() {
  if (!tokens) { invalidLink(); return; }
  try {
    const { data, error } = await recovery.auth.setSession(tokens);
    if (error || !data?.session) { invalidLink(); return; }
    ready = true;
    form.hidden = false;
    submit.disabled = false;
    notice(msg('Choose and confirm a new password to finish resetting your account.',
      'اختاري كلمة مرور جديدة وأكديها لإكمال إعادة تعيين حسابك.'));
    $('ed-new-password').focus();
  } catch { invalidLink(); }
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!ready || pending || !form.reportValidity()) return;
  const password = $('ed-new-password').value;
  const problem = passwordProblem(password, $('ed-confirm-password').value);
  if (problem) {
    notice(problem === 'short'
      ? msg('Use a password of at least 12 characters.', 'كلمة المرور يجب أن تتكون من ١٢ حرفًا على الأقل.')
      : msg('The passwords do not match.', 'كلمتا المرور غير متطابقتين.'));
    return;
  }
  pending = true;
  submit.disabled = true;
  notice(msg('Updating password…', 'جارٍ تغيير كلمة المرور…'));
  try {
    const { error } = await recovery.auth.updateUser({ password });
    if (error) {
      notice(msg('The password could not be updated. Use a different strong password, or request a new reset link if this one expired.',
        'تعذّر تغيير كلمة المرور. استخدمي كلمة مرور قوية مختلفة، أو اطلبي رابطًا جديدًا إذا انتهت صلاحيته.'));
      return;
    }
    // This isolated session is never copied into the CMS or Process client.
    ready = false;
    form.reset();
    form.hidden = true;
    try { await recovery.auth.signOut({ scope: 'local' }); } catch {}
    notice(msg('Password updated. Return to the Editorial Desk and sign in with your new password.',
      'تم تغيير كلمة المرور. عودي إلى المكتب التحريري وسجّلي الدخول بكلمة المرور الجديدة.'));
  } catch {
    notice(msg('Unable to update the password. Check your connection and try again.',
      'تعذّر تغيير كلمة المرور. تحققي من الاتصال وحاولي مجددًا.'));
  } finally {
    pending = false;
    submit.disabled = !ready;
  }
});
void initialize();
