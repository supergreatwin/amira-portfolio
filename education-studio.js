import { db, byId as $, isStaff, identify, STAGES, TYPES, setMessage, niceError, slugify, safeHttps, safeFilename, renderStageOptions, formatSize } from './education-core.js';
const state={ user:null, course:null, lesson:null, courses:[], lessons:[], assets:[], submission:null, loading:false };
const status=(m,e=false)=>setMessage('studio-status',m,e);
const val=id=>$(id).value.trim();
const tabs=[...document.querySelectorAll('[data-tab]')];
const panes=[...document.querySelectorAll('[data-pane]')];
function tab(name) { tabs.forEach(x=>x.classList.toggle('active',x.dataset.tab===name)); panes.forEach(x=>x.hidden=x.dataset.pane!==name); }
function needCourse() { if(state.course)return true;status('Choose or create a collection first.',true);tab('courses');return false; }
function needLesson() { if(state.lesson)return true;status('Choose or create a lesson first.',true);tab('lessons');return false; }
function addList(container,items,label,getSelected,onClick) {
  container.replaceChildren();
  if(!items.length){const p=document.createElement('p');p.className='edu-note';p.textContent='Nothing saved yet.';container.append(p);return;}
  for(const item of items){
    const b=document.createElement('button');b.type='button';
    b.textContent=label(item);
    b.setAttribute('aria-current',String(item.id===getSelected()));
    b.onclick=()=>onClick(item);
    container.append(b);
  }
}
async function loadCourses() {
  const {data,error}=await db.from('edu_courses').select('*').order('sort_order').order('created_at');
  if(error)throw error;
  state.courses=data||[];
  addList($('course-list'),state.courses,x=>x.title+' · '+x.status,()=>state.course?.id,chooseCourse);
}
function clearCourse() {
  state.course=null;state.lesson=null;state.lessons=[];
  $('course-form').reset();$('lesson-form').reset();
  $('lesson-new').disabled=true;
  $('lesson-list').replaceChildren();
  $('resource-list').replaceChildren();
}
function chooseCourse(course) {
  state.course=course;state.lesson=null;
  for(const [field,key] of [
    ['course-title','title'],['course-slug','slug'],['course-status','status'],
    ['course-subtitle','subtitle'],['course-description','description']
  ]) $(field).value=course[key]??'';
  $('lesson-new').disabled=false;
  addList($('course-list'),state.courses,x=>x.title+' · '+x.status,()=>state.course?.id,chooseCourse);
  void loadLessons().catch(e=>status(niceError(e),true));
}
async function loadLessons(){
  if(!state.course)return;
  const {data,error}=await db.from('edu_lessons').select('*').eq('course_id',state.course.id).order('sort_order').order('created_at');
  if(error)throw error;
  state.lessons=data||[];
  addList($('lesson-list'),state.lessons,x=>{
    const stage=STAGES.find(s=>s.id===x.stage);
    return (stage?.label.split('/ ')[1]||x.stage)+' · '+x.title+' ['+x.status+']';
  },()=>state.lesson?.id,chooseLesson);
  if(state.lesson){const current=state.lessons.find(x=>x.id===state.lesson.id);if(current)await chooseLesson(current);}
}
async function chooseLesson(lesson){
  state.lesson=lesson;
  for(const [field,key] of [
    ['lesson-stage','stage'],['lesson-kind','lesson_kind'],['lesson-title','title'],
    ['lesson-summary','summary'],['lesson-body','body_markdown'],['lesson-video','video_url'],
    ['lesson-duration','duration_minutes'],['lesson-order','sort_order'],['lesson-status','status']
  ]) $(field).value=lesson[key]??'';
  addList($('lesson-list'),state.lessons,x=>x.title+' · '+x.status,()=>state.lesson?.id,chooseLesson);
  await Promise.all([loadResources(),loadAssignments(),loadQuiz()]);
}
async function loadResources(){
  $('resource-list').replaceChildren();
  if(!state.lesson)return;
  const {data,error}=await db.from('edu_resources').select('*').eq('lesson_id',state.lesson.id).order('sort_order').order('created_at');
  if(error)throw error;
  state.assets=data||[];
  const h=document.createElement('h3');h.textContent='Attached resources';$('resource-list').append(h);
  for(const asset of state.assets){
    const item=document.createElement('div');item.className='edu-file';
    const t=document.createElement('div'),label=document.createElement('strong'),meta=document.createElement('small'),del=document.createElement('button');
    label.textContent=asset.title;meta.textContent=asset.resource_type+(asset.byte_size?' · '+formatSize(asset.byte_size):'')+(asset.storage_path?' · private upload':' · external link');
    t.append(label,document.createElement('br'),meta);del.textContent='Remove';del.type='button';
    del.onclick=async()=>{
      if(!window.confirm('Remove this resource and its private file?'))return;
      try{
        const {error}=await db.from('edu_resources').delete().eq('id',asset.id);if(error)throw error;
        if(asset.storage_path){const {error:storageError}=await db.storage.from('amira-education-private').remove([asset.storage_path]);if(storageError)throw storageError;}
        await loadResources();status('Resource removed.');
      }catch(e){status(niceError(e),true);}
    };
    item.append(t,del);$('resource-list').append(item);
  }
}
async function loadAssignments(){
  $('assignment-list').replaceChildren();if(!state.lesson)return;
  const {data,error}=await db.from('edu_assignments').select('id,title,status').eq('lesson_id',state.lesson.id).order('created_at');
  if(error)throw error;
  for(const a of data||[]){const p=document.createElement('p');p.className='edu-note';p.textContent=a.title+' — '+a.status;$('assignment-list').append(p);}
}
async function loadQuiz(){
  $('quiz-list').replaceChildren();if(!state.lesson)return;
  const {data,error}=await db.from('edu_quiz_questions').select('id,question_text,choices').eq('lesson_id',state.lesson.id).order('sort_order');
  if(error)throw error;
  for(const q of data||[]){const p=document.createElement('p');p.className='edu-note';p.textContent=q.question_text+' ('+q.choices.length+' choices)';$('quiz-list').append(p);}
}
function newCourse(){clearCourse();tab('courses');$('course-title').focus();}
function newLesson(){
  if(!needCourse())return;
  state.lesson=null;$('lesson-form').reset();
  $('lesson-stage').value='idea';$('lesson-kind').value='reading';$('lesson-status').value='draft';$('lesson-order').value='0';
  $('resource-list').replaceChildren();$('assignment-list').replaceChildren();$('quiz-list').replaceChildren();
  tab('lessons');$('lesson-title').focus();
}
$('course-new').onclick=newCourse;
$('lesson-new').onclick=newLesson;
$('course-title').addEventListener('input',()=>{if(!state.course)$('course-slug').value=slugify(val('course-title'));});
$('course-form').onsubmit=async e=>{
  e.preventDefault();
  const payload={
    title:val('course-title'),slug:val('course-slug').toLowerCase(),subtitle:val('course-subtitle'),
    description:val('course-description'),status:val('course-status')
  };
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)){status('Use lowercase letters, numbers and hyphens for the identifier.',true);return;}
  try{
    const q=state.course
      ? db.from('edu_courses').update(payload).eq('id',state.course.id)
      : db.from('edu_courses').insert({...payload,created_by:state.user.id});
    const {data,error}=await q.select('*').single();if(error)throw error;
    await loadCourses();chooseCourse(data);status('Collection saved privately. Release is still disabled.');
  }catch(err){status(niceError(err),true);}
};
$('lesson-form').onsubmit=async e=>{
  e.preventDefault();if(!needCourse())return;
  const external=val('lesson-video');if(external&&!safeHttps(external)){status('Video URLs must use HTTPS.',true);return;}
  const payload={
    course_id:state.course.id,stage:val('lesson-stage'),lesson_kind:val('lesson-kind'),
    title:val('lesson-title'),summary:val('lesson-summary'),body_markdown:val('lesson-body'),
    video_url:external||null,duration_minutes:val('lesson-duration')?Number(val('lesson-duration')):null,
    sort_order:Number(val('lesson-order')||0),status:val('lesson-status')
  };
  try{
    const q=state.lesson?db.from('edu_lessons').update(payload).eq('id',state.lesson.id):db.from('edu_lessons').insert(payload);
    const {data,error}=await q.select('*').single();if(error)throw error;
    state.lesson=data;await loadLessons();status('Lesson saved privately.');
  }catch(err){status(niceError(err),true);}
};
$('lesson-resources').onclick=()=>{if(needLesson())tab('resources');};
$('resource-file-form').onsubmit=async e=>{
  e.preventDefault();if(!needLesson())return;
  const file=$('resource-file').files?.[0];if(!file)return;
  if(file.size>50*1024*1024){status('File exceeds the 50 MB upload limit. Use an approved streaming service for larger videos.',true);return;}
  const ext=file.name.toLowerCase().split('.').pop();
  const allowed=['pdf','mp4','webm','mp3','m4a','wav','jpg','jpeg','png','webp','zip','pptx','docx','txt','vtt','srt'];
  if(!allowed.includes(ext)){status('Unsupported file extension.',true);return;}
  const path='lessons/'+state.lesson.id+'/'+crypto.randomUUID()+'-'+safeFilename(file.name);
  const fileType=file.type||'application/octet-stream';
  const button=e.target.querySelector('[type=submit]');button.disabled=true;status('Uploading '+file.name+'…');
  try{
    const {error:uploadError}=await db.storage.from('amira-education-private').upload(path,file,{contentType:fileType,upsert:false});
    if(uploadError)throw uploadError;
    const data={
      lesson_id:state.lesson.id,resource_type:val('resource-kind'),title:val('resource-title'),
      description:val('resource-desc'),storage_path:path,mime_type:fileType,byte_size:file.size,
      is_downloadable:$('resource-download').checked
    };
    const {error:saveError}=await db.from('edu_resources').insert(data);
    if(saveError){await db.storage.from('amira-education-private').remove([path]);throw saveError;}
    e.target.reset();await loadResources();status('Private file uploaded and attached successfully.');
  }catch(err){status(niceError(err),true);}finally{button.disabled=false;}
};
$('resource-file').onchange=()=>{
  const file=$('resource-file').files?.[0];if(!file)return;
  $('resource-title').value=file.name.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ');
  const ext=file.name.toLowerCase().split('.').pop();
  const map={pdf:'pdf',mp4:'video',webm:'video',mp3:'audio',m4a:'audio',wav:'audio',jpg:'image',jpeg:'image',png:'image',webp:'image',pptx:'slides',docx:'worksheet',zip:'archive',vtt:'subtitles',srt:'subtitles',txt:'transcript'};
  $('resource-kind').value=map[ext]||'other';
};
$('resource-link-form').onsubmit=async e=>{
  e.preventDefault();if(!needLesson())return;
  const url=safeHttps(val('link-url'));if(!url){status('Only HTTPS resource links are accepted.',true);return;}
  try{
    const {error}=await db.from('edu_resources').insert({
      lesson_id:state.lesson.id,title:val('link-title'),resource_type:val('link-kind'),
      external_url:url,is_downloadable:false
    });
    if(error)throw error;e.target.reset();await loadResources();status('External reference attached.');
  }catch(err){status(niceError(err),true);}
};
$('assignment-form').onsubmit=async e=>{
  e.preventDefault();if(!needLesson())return;
  try{
    const {error}=await db.from('edu_assignments').insert({
      lesson_id:state.lesson.id,title:val('assignment-title'),
      instructions:val('assignment-instructions'),
      max_points:val('assignment-points')?Number(val('assignment-points')):null,
      status:val('assignment-status')
    });
    if(error)throw error;e.target.reset();await loadAssignments();status('Assignment saved.');
  }catch(err){status(niceError(err),true);}
};
$('quiz-form').onsubmit=async e=>{
  e.preventDefault();if(!needLesson())return;
  const choices=val('quiz-choices').split('\n').map(x=>x.trim()).filter(Boolean);
  const correct=Number(val('quiz-correct'))-1;
  if(choices.length<2||correct<0||correct>=choices.length){status('Provide at least two choices and a valid correct choice number.',true);return;}
  try{
    const {data,error}=await db.from('edu_quiz_questions').insert({
      lesson_id:state.lesson.id,question_text:val('quiz-question'),choices
    }).select('id').single();if(error)throw error;
    const {error:keyError}=await db.from('edu_quiz_answers').insert({
      question_id:data.id,correct_choice_index:correct,explanation:val('quiz-explanation')
    });
    if(keyError){await db.from('edu_quiz_questions').delete().eq('id',data.id);throw keyError;}
    e.target.reset();await loadQuiz();status('Quiz question saved. Learner scoring is not yet activated.');
  }catch(err){status(niceError(err),true);}
};
async function loadReviews(){
  const target=$('review-list');target.replaceChildren();
  const {data,error}=await db.from('edu_submissions').select('id,assignment_id,user_id,answer_text,status,attachment_path,created_at').order('created_at',{ascending:false}).limit(100);
  if(error)throw error;
  for(const sub of data||[]){
    const b=document.createElement('button');b.className='edu-card';b.type='button';
    b.textContent='Submission · '+new Date(sub.created_at).toLocaleDateString()+' · '+sub.status+' · '+sub.user_id.slice(0,8);
    b.onclick=()=>{state.submission=sub;$('review-form').hidden=false;$('review-answer').textContent=sub.answer_text||'(File submission)';
      $('review-points').value='';$('review-comments').value='';$('review-release').checked=false;};
    target.append(b);
  }
  if(!data?.length)target.textContent='No learner submissions yet.';
}
$('review-reload').onclick=()=>loadReviews().catch(e=>status(niceError(e),true));
$('review-form').onsubmit=async e=>{
  e.preventDefault();if(!state.submission)return;
  const data={
    submission_id:state.submission.id,points:val('review-points')?Number(val('review-points')):null,
    comments:val('review-comments'),released_to_student:$('review-release').checked,reviewed_at:new Date().toISOString()
  };
  const {error}=await db.from('edu_feedback').upsert(data,{onConflict:'submission_id'});
  if(error){status(niceError(error),true);return;}status('Feedback saved.');$('review-form').hidden=true;
};
tabs.forEach(b=>b.onclick=()=>{tab(b.dataset.tab);if(b.dataset.tab==='review')void loadReviews().catch(e=>status(niceError(e),true));});
$('studio-reload').onclick=async()=>{try{await loadCourses();if(state.course)await loadLessons();status('Workspace refreshed.');}catch(e){status(niceError(e),true);}};
$('studio-logout').onclick=async()=>{await db.auth.signOut();location.href='editorial.html';};
for(const id of ['resource-kind','link-kind']){
  const el=$(id);TYPES.forEach(type=>{const opt=document.createElement('option');opt.value=type;opt.textContent=type;el.append(opt);});
}
renderStageOptions($('lesson-stage'));
async function start(){
  const identity=await identify();
  if(!identity.user||!isStaff(identity.user)){status('An authorized Editorial Desk session is required.',true);return;}
  state.user=identity.user;
  $('studio-user').textContent=identity.user.email;
  $('studio-locked').hidden=true;$('studio-main').hidden=false;
  await loadCourses();
  if(state.courses.length)chooseCourse(state.courses[0]);
  status('Private Editorial Desk ready. Public release remains disabled.');
}
void start().catch(e=>status(niceError(e),true));
