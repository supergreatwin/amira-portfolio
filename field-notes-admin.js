import { cms, isEditor } from './cms-core.js';
const root=document.querySelector('[data-field-notes-admin]');
if(root){
 const ar=document.documentElement.lang==='ar';
 const say=(en,arText)=>ar?arText:en;
 const $=selector=>root.querySelector(selector);
 const body=$('[data-fn-admin-body]'),status=$('[data-fn-admin-status]');
 const search=$('[data-fn-admin-search]'),filter=$('[data-fn-admin-filter]');
 const back=$('[data-fn-page-back]'),forward=$('[data-fn-page-next]'),count=$('[data-fn-admin-count]');
 let page=0,total=0,busy=false,term='',currentStatus='all',timer=null;
 const limit=50;
 const notice=(message,error=false)=>{status.textContent=message;status.classList.toggle('is-error',error);};
 const canAccess=async()=>{
  const {data:{user},error}=await cms.auth.getUser();
  return !error&&isEditor(user);
 };
 function filterQuery(base){
  let q=base;
  if(currentStatus!=='all')q=q.eq('status',currentStatus);
  if(term)q=q.ilike('email','%'+term.replace(/[%_,]/g,'')+'%');
  return q;
 }
 function cell(row,value){
  const td=document.createElement('td');td.textContent=value;row.append(td);
 }
 function makeRow(record){
  const tr=document.createElement('tr');
  cell(tr,record.email);
  cell(tr,record.locale.toUpperCase());
  cell(tr,record.status==='subscribed'?say('Subscribed','مشترك'):say('Unsubscribed','ملغي'));
  cell(tr,new Date(record.subscribed_at).toLocaleDateString(ar?'ar-EG':'en-GB'));
  const td=document.createElement('td'),button=document.createElement('button');
  const next=record.status==='subscribed'?'unsubscribed':'subscribed';
  button.type='button';button.className='ed-button ghost';
  button.textContent=next==='unsubscribed'?say('Unsubscribe','إلغاء الاشتراك'):say('Reactivate','إعادة التفعيل');
  button.addEventListener('click',()=>void changeStatus(record,next));
  td.append(button);tr.append(td);return tr;
 }
 async function load(){
  if(busy)return;
  if(!(await canAccess())){root.hidden=true;body.replaceChildren();return;}
  root.hidden=false;busy=true;notice(say('Loading subscribers…','جارٍ تحميل المشتركين…'));
  try{
   const query=filterQuery(cms.from('field_notes_subscribers')
    .select('id,email,locale,status,subscribed_at,consent_at',{count:'exact'}))
    .order('subscribed_at',{ascending:false}).range(page*limit,(page+1)*limit-1);
   const {data,error,count:rows}=await query;
   if(error)throw error;
   total=rows??0;
   body.replaceChildren(...(data??[]).map(makeRow));
   count.textContent=say(String(total)+' subscriber records',String(total)+' سجل اشتراك');
   back.disabled=page===0;forward.disabled=(page+1)*limit>=total;
   notice(data?.length?say('Subscriber list updated.','تم تحديث قائمة المشتركين.'):say('No subscribers match these filters.','لا يوجد مشتركون بهذه المعايير.'));
  }catch(error){notice(error.message||String(error),true)}
  finally{busy=false}
 }
 async function changeStatus(record,next){
  if(busy||!(await canAccess()))return;
  if(next==='subscribed'&&!window.confirm(say(
   'Reactivate only after receiving fresh permission from this address. Continue?',
   'أعيدي التفعيل فقط بعد موافقة جديدة من صاحب البريد. هل تريدين المتابعة؟'
  )))return;
  busy=true;notice(say('Saving change…','جارٍ حفظ التغيير…'));
  try{
   const now=new Date().toISOString();
   const {error}=await cms.from('field_notes_subscribers').update({
    status:next,unsubscribed_at:next==='unsubscribed'?now:null,updated_at:now
   }).eq('id',record.id);
   if(error)throw error;
   busy=false;await load();
  }catch(error){notice(error.message||String(error),true);busy=false}
 }
 const quote=value=>{
  let v=String(value??'');
  if(/^[=+\-@\t\r]/.test(v))v="'"+v;
  return '"'+v.replace(/"/g,'""')+'"';
 };
 async function exportCsv(){
  if(busy||!(await canAccess()))return;
  busy=true;notice(say('Preparing CSV export…','جارٍ تجهيز ملف CSV…'));
  try{
   const rows=[],pageSize=500;
   for(let offset=0;;offset+=pageSize){
    const query=filterQuery(cms.from('field_notes_subscribers')
      .select('email,locale,status,subscribed_at,consent_at'))
      .order('subscribed_at',{ascending:false}).range(offset,offset+pageSize-1);
    const {data,error}=await query;
    if(error)throw error;
    rows.push(...(data||[]));
    if(!data||data.length<pageSize)break;
   }
   const columns=['email','locale','status','subscribed_at','consent_at'];
   const csv=[columns.map(quote).join(','),...rows.map(r=>columns.map(k=>quote(r[k])).join(','))].join('\r\n');
   const url=URL.createObjectURL(new Blob([String.fromCharCode(0xfeff),csv],{type:'text/csv;charset=utf-8'}));
   const link=document.createElement('a');
   link.href=url;link.download='amira-field-notes-subscribers.csv';
   document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   notice(say('Exported '+rows.length+' records.','تم تصدير '+rows.length+' سجل.'));
  }catch(error){notice(error.message||String(error),true)}
  finally{busy=false}
 }
 $('[data-fn-admin-refresh]').addEventListener('click',()=>void load());
 $('[data-fn-admin-export]').addEventListener('click',()=>void exportCsv());
 back.addEventListener('click',()=>{if(page>0){page--;void load()}});
 forward.addEventListener('click',()=>{if((page+1)*limit<total){page++;void load()}});
 filter.addEventListener('change',()=>{currentStatus=filter.value;page=0;void load()});
 search.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{term=search.value.trim();page=0;void load()},350)});
 void load();
 cms.auth.onAuthStateChange(event=>{
  if(['SIGNED_IN','SIGNED_OUT','TOKEN_REFRESHED','USER_UPDATED'].includes(event))
   setTimeout(()=>{if(!busy)void load()},0);
 });
}
