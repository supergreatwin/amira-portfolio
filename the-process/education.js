import { db, identify, byId as $, setMessage, niceError, STAGES, articleText, safeHttps, formatSize, safeFilename } from '../education-core.js';
const state={identity:null,courses:[],course:null,lessons:[],currentLesson:null,enrolled:false,archiveStage:'all',archiveSearch:''};
const status=(m,e=false)=>setMessage('student-status',m,e);
function element(tag,className,text){const x=document.createElement(tag);if(className)x.className=className;if(text!==undefined)x.textContent=text;return x;}
function showPrivate(identity){
  state.identity=identity;$('student-login').hidden=true;$('student-learning').hidden=false;
  $('student-logout').hidden=false;
  $('student-account').textContent=(identity.member?.display_name||identity.user.email)+(identity.staff?' · Instructor preview':' · Student');
}
async function loadCourses(){
  const {data,error}=await db.from('edu_courses').select('id,title,subtitle,description,status,slug').order('sort_order').order('created_at');
  if(error)throw error;
  state.courses=data||[];
  const container=$('student-courses');container.replaceChildren();
  if(!state.courses.length){
    container.append(element('p','edu-note','The first learning collection is being prepared.'));
    state.course=null;state.lessons=[];state.enrolled=false;
    $('student-course-title').textContent='Eight stages. One story.';
    $('student-course-description').textContent='From the first idea to a 1-1 with Amira: explore the complete filmmaking journey. Lessons are being prepared.';
    renderStages();await renderFeedback();
  }
  for(const course of state.courses){
    const b=element('button','edu-card');b.type='button';
    const h=element('h3','',course.title),small=element('small','',course.subtitle||course.status);
    b.append(element('span','edu-card-label','Learning collection'),h,small);
    b.onclick=()=>void selectCourse(course).catch(err=>status(niceError(err),true));
    container.append(b);
  }
  if(state.courses.length)await selectCourse(state.courses[0]);
}
async function selectCourse(course){
  state.course=course;state.currentLesson=null;
  $('student-lesson-view').hidden=true;
  $('student-course-title').textContent=course.title;
  $('student-course-description').textContent=course.description||course.subtitle||'An introduction to the stages of filmmaking.';
  const {data:enrollment,error:enrollmentError}=await db.from('edu_enrollments').select('course_id').eq('course_id',course.id).eq('user_id',state.identity.user.id).maybeSingle();
  if(enrollmentError)throw enrollmentError;
  state.enrolled=!!enrollment||state.identity.staff;
  const enrollmentEl=$('student-enrollment');enrollmentEl.replaceChildren();
  if(!state.enrolled&&!state.identity.staff){
    const b=element('button','edu-button','Join this collection');b.type='button';
    b.onclick=async()=>{
      const {error}=await db.from('edu_enrollments').insert({user_id:state.identity.user.id,course_id:course.id});
      if(error){status(niceError(error),true);return;}
      await selectCourse(course);status('You are enrolled.');
    };
    enrollmentEl.append(b);
  }
  if(state.enrolled){
    const {data,error}=await db.from('edu_lessons')
      .select('id,course_id,stage,lesson_kind,title,summary,duration_minutes,sort_order,status,body_markdown,video_url')
      .eq('course_id',course.id).order('sort_order').order('created_at');
    if(error)throw error;state.lessons=data||[];
  }else state.lessons=[];
  renderStages();
  await renderFeedback();
}
function renderStages(){
  const area=$('student-stages');area.replaceChildren();
  for(const stage of STAGES){
    const finalStage=stage.id==='amira_feedback';
    const sec=element('section',finalStage?'edu-stage edu-stage--feedback':'edu-stage'),heading=element('h3','',stage.label);
    sec.append(element('span','edu-eyebrow',finalStage?'The final cut? Let’s talk. ✦':'The process'),heading,element('p','',stage.description));
    const list=element('div','edu-lessons');
    for(const lesson of state.lessons.filter(x=>x.stage===stage.id)){
      const b=element('button','edu-lesson');b.type='button';
      const t=element('span');t.append(element('strong','',lesson.title),element('small','',lesson.lesson_kind+(lesson.duration_minutes?' · '+lesson.duration_minutes+' min':'')));
      b.append(t,element('span','','↗'));
      b.onclick=()=>void openLesson(lesson).catch(e=>status(niceError(e),true));
      list.append(b);
    }
    if(!list.children.length&&state.course)list.append(element('p','edu-note',state.enrolled?'Lessons will appear here when added.':'Join the collection to view lessons.'));
    sec.append(list);
    if(finalStage){
      const note=element('p','edu-feedback-prompt','✦ The best part of a first cut? It isn’t the last. This is your space for Amira’s notes and your next breakthrough.');
      const feedbackArea=element('div','edu-feedback-list');feedbackArea.id='student-feedback';
      sec.append(note,feedbackArea);
    }
    area.append(sec);
  }
  renderArchive();
}
function renderArchive(){
  const area=$('archive-cards');if(!area)return;
  area.replaceChildren();
  const text=state.archiveSearch.trim().toLocaleLowerCase();
  const filtered=state.lessons.filter(lesson=>
    (state.archiveStage==='all'||lesson.stage===state.archiveStage)&&
    (!text||[lesson.title,lesson.summary,lesson.lesson_kind,STAGES.find(s=>s.id===lesson.stage)?.label].some(value=>String(value||'').toLocaleLowerCase().includes(text)))
  );
  if(!filtered.length){
    const empty=element('p','process-archive-empty',
      state.course?(state.lessons.length?'No lessons match this stage or search. Try another filter.':'No lessons are published in this collection yet. Amira can add them through the private Educational Studio.')
        :'The archive is being curated. There are no learning collections to browse yet.');
    area.append(empty);return;
  }
  for(const [index,lesson] of filtered.entries()){
    const stage=STAGES.find(item=>item.id===lesson.stage);
    const card=element('button','process-archive-card');card.type='button';
    card.append(element('span','process-archive-card__number',String(index+1).padStart(2,'0')));
    card.append(element('span','process-archive-card__stage',stage?.label||'The process'));
    card.append(element('h3','process-archive-card__title',lesson.title));
    card.append(element('p','process-archive-card__summary',lesson.summary||'Open this lesson to explore the process and its attached resources.'));
    const foot=element('span','process-archive-card__footer');foot.append(element('span','',lesson.lesson_kind||'Lesson'),element('span','','Explore lesson ↗'));
    card.append(foot);
    card.onclick=()=>void openLesson(lesson).catch(error=>status(niceError(error),true));
    area.append(card);
  }
}
async function renderFeedback(){
  const area=$('student-feedback');if(!area)return;
  area.replaceChildren();
  const empty=message=>area.append(element('p','edu-note',message));
  if(!state.course){empty('Lessons and personal feedback will appear here as this learning space develops.');return;}
  if(!state.enrolled||state.identity.staff){empty('Personal feedback appears here after Amira reviews and releases it. Sessions and reviews are arranged separately.');return;}
  const lessonIds=state.lessons.map(lesson=>lesson.id);
  if(!lessonIds.length){empty('Your feedback will appear here after you submit work and Amira releases her notes.');return;}
  const {data:assignments,error:assignmentError}=await db.from('edu_assignments').select('id,title').in('lesson_id',lessonIds);
  if(assignmentError)throw assignmentError;
  if(!assignments?.length){empty('Your feedback will appear here after you submit work and Amira releases her notes.');return;}
  const titles=new Map(assignments.map(item=>[item.id,item.title]));
  const {data:submissions,error:submissionError}=await db.from('edu_submissions').select('id,assignment_id').eq('user_id',state.identity.user.id).in('assignment_id',assignments.map(item=>item.id));
  if(submissionError)throw submissionError;
  if(!submissions?.length){empty('Your first piece of feedback is still ahead. Submit an assignment to start the conversation.');return;}
  const submitted=new Map(submissions.map(item=>[item.id,item.assignment_id]));
  const {data:notes,error:feedbackError}=await db.from('edu_feedback').select('submission_id,comments,points,reviewed_at').eq('released_to_student',true).in('submission_id',submissions.map(item=>item.id)).order('reviewed_at',{ascending:false});
  if(feedbackError)throw feedbackError;
  if(!notes?.length){empty('Amira’s notes have not been released yet. Check back after your work has been reviewed.');return;}
  area.append(element('h4','edu-feedback-heading','Your notes from Amira'));
  for(const note of notes){
    const card=element('article','edu-feedback-card');
    card.append(element('strong','',titles.get(submitted.get(note.submission_id))||'Your submitted work'));
    if(note.comments)card.append(element('p','',note.comments));
    const metadata=[note.points===null||note.points===undefined?'':'Score: '+note.points,
      note.reviewed_at?'Reviewed '+new Date(note.reviewed_at).toLocaleDateString():''].filter(Boolean).join(' · ');
    if(metadata)card.append(element('small','edu-note',metadata));
    area.append(card);
  }
}
async function openLesson(lesson){
  state.currentLesson=lesson;
  $('student-lesson-title').textContent=lesson.title;$('student-lesson-summary').textContent=lesson.summary;
  $('student-lesson-stage').textContent=STAGES.find(x=>x.id===lesson.stage)?.label||lesson.stage;
  articleText($('student-lesson-body'),lesson.body_markdown);
  const media=$('student-lesson-media');media.replaceChildren();
  if(lesson.video_url&&safeHttps(lesson.video_url)){
    const url=new URL(lesson.video_url);
    let embed=null;
    if(['www.youtube.com','youtube.com','youtu.be','www.youtube-nocookie.com'].includes(url.hostname)){
      const id=url.hostname==='youtu.be'?url.pathname.slice(1):url.searchParams.get('v');
      if(id&&/^[a-zA-Z0-9_-]{11}$/.test(id))embed='https://www.youtube-nocookie.com/embed/'+id;
    }else if(['vimeo.com','www.vimeo.com'].includes(url.hostname)){
      const id=url.pathname.split('/').filter(Boolean)[0];
      if(id&&/^\d+$/.test(id))embed='https://player.vimeo.com/video/'+id;
    }
    if(embed){
      const iframe=element('iframe','edu-media');iframe.src=embed;
      iframe.title='Video lesson: '+lesson.title;iframe.loading='lazy';iframe.referrerPolicy='strict-origin-when-cross-origin';
      iframe.allow='fullscreen; picture-in-picture';iframe.setAttribute('allowfullscreen','');media.append(iframe);
    }else{
      const a=element('a','edu-button alt','Open linked video ↗');a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';media.append(a);
    }
  }
  await Promise.all([renderResources(lesson),renderAssignments(lesson),renderQuiz(lesson)]);
  $('student-lesson-view').hidden=false;
  $('student-lesson-view').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
async function renderResources(lesson){
  const area=$('student-resources');area.replaceChildren();
  const {data,error}=await db.from('edu_resources').select('id,title,description,resource_type,storage_path,external_url,mime_type,byte_size,is_downloadable')
    .eq('lesson_id',lesson.id).order('sort_order').order('created_at');
  if(error)throw error;
  if(!data?.length){area.append(element('p','edu-note','No attached documents yet.'));return;}
  for(const resource of data){
    const row=element('div','edu-file'),label=element('div');
    label.append(element('strong','',resource.title),document.createElement('br'),element('small','',resource.resource_type+(resource.byte_size?' · '+formatSize(resource.byte_size):'')));
    const b=element('button','','Open ↗');b.type='button';b.onclick=()=>void openResource(resource);
    row.append(label,b);area.append(row);
  }
}
async function openResource(asset){
  try{
    let url;
    if(asset.storage_path){
      const {data,error}=await db.storage.from('amira-education-private').createSignedUrl(asset.storage_path,600);
      if(error)throw error;url=data.signedUrl;
    }else url=safeHttps(asset.external_url);
    if(!url)throw new Error('This file is unavailable.');
    const destination=window.open(url,'_blank','noopener,noreferrer');
    if(!destination)status('Allow the browser to open the resource in a new tab.');
    else status('Private resource link issued for 10 minutes.');
  }catch(e){status(niceError(e),true);}
}
async function renderAssignments(lesson){
  const panel=$('student-assignment-container'),area=$('student-assignments');area.replaceChildren();
  const {data,error}=await db.from('edu_assignments').select('id,title,instructions,max_points')
    .eq('lesson_id',lesson.id).eq('status','published');
  if(error)throw error;panel.hidden=!data?.length;
  for(const assignment of data||[]){
    const block=element('div','edu-panel'),title=element('h3','',assignment.title),p=element('p','edu-note',assignment.instructions);
    block.append(title,p);
    if(!state.identity.staff){
      const {data:submitted}=await db.from('edu_submissions').select('id,status').eq('assignment_id',assignment.id).eq('user_id',state.identity.user.id).maybeSingle();
      if(submitted){block.append(element('p','edu-note','Your assignment is '+submitted.status+'.'));area.append(block);continue;}
      const form=document.createElement('form');form.innerHTML='<div class="edu-field"><label>Your response<textarea rows="5" required maxlength="12000"></textarea></label></div><div class="edu-field"><label>Optional attached file<input type="file" accept=".pdf,.mp4,.webm,.jpg,.jpeg,.png,.webp,.docx,.pptx,.zip,.txt"></label></div><button type="submit" class="edu-button">Submit assignment</button>';
      form.onsubmit=async e=>{
        e.preventDefault();const answer=form.querySelector('textarea').value.trim();
        const file=form.querySelector('input[type=file]').files?.[0];let path=null;
        if(file&&file.size>50*1024*1024){status('Assignment file must be below 50 MB.',true);return;}
        const submit=form.querySelector('[type=submit]');submit.disabled=true;
        try{
          if(file){
            path='submissions/'+state.identity.user.id+'/'+crypto.randomUUID()+'-'+safeFilename(file.name);
            const {error:uploadError}=await db.storage.from('amira-education-private').upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false});
            if(uploadError)throw uploadError;
          }
          const {error:submitError}=await db.from('edu_submissions').insert({
            assignment_id:assignment.id,user_id:state.identity.user.id,answer_text:answer,
            attachment_path:path,status:'submitted'
          });
          if(submitError)throw submitError;
          status('Your assignment was submitted.');
          await renderAssignments(lesson);
        }catch(e){status(niceError(e),true);}finally{submit.disabled=false;}
      };
      block.append(form);
    }
    area.append(block);
  }
}
async function renderQuiz(lesson){
  const section=$('student-quiz-container'),area=$('student-quizzes');area.replaceChildren();
  const {data,error}=await db.from('edu_quiz_questions').select('id,question_text,choices').eq('lesson_id',lesson.id).order('sort_order');
  if(error)throw error;section.hidden=!data?.length;
  for(const question of data||[]){
    const block=element('fieldset','edu-panel');const legend=element('legend','',question.question_text);
    block.append(legend);
    for(let i=0;i<question.choices.length;i++){
      const label=document.createElement('label'),input=document.createElement('input');
      input.type='radio';input.name='quiz-'+question.id;input.value=String(i);
      label.append(input,document.createTextNode(' '+String(question.choices[i])));
      label.style.cssText='display:block;margin:.6rem 0';block.append(label);
    }
    block.append(element('p','edu-note','Practice only — automatic scoring will be available after launch.'));area.append(block);
  }
}
$('student-complete').onclick=async()=>{
  if(!state.currentLesson)return;
  const {error}=await db.from('edu_progress').upsert({
    lesson_id:state.currentLesson.id,user_id:state.identity.user.id,completed_at:new Date().toISOString(),
    updated_at:new Date().toISOString()
  },{onConflict:'lesson_id,user_id'});
  status(error?niceError(error):'Lesson marked complete.',!!error);
};
$('student-back').onclick=()=>{
  $('student-lesson-view').hidden=true;
  $('archive-cards').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
};
$('student-logout').onclick=async()=>{await db.auth.signOut();location.reload();};
for(const control of document.querySelectorAll('[data-archive-stage]')){
  control.addEventListener('click',()=>{
    state.archiveStage=control.dataset.archiveStage;
    for(const button of document.querySelectorAll('[data-archive-stage]')){
      const current=button===control;
      button.classList.toggle('active',current);
      button.setAttribute('aria-pressed',String(current));
    }
    renderArchive();
  });
}
$('archive-search').addEventListener('input',event=>{
  state.archiveSearch=event.target.value;
  renderArchive();
});
async function start(){
  const identity=await identify();
  // Pre-launch: only editorial staff can enter even when an existing learner token is present.
  if(!identity.user || !identity.staff || !identity.member){
    status('Private workspace. Sign in through the approved Editorial Desk account.');
    return;
  }
  const hero=document.querySelector('.edu-hero');if(hero)hero.hidden=false;
  showPrivate(identity);
  await loadCourses();
  status('Instructor-only working site. Learner access remains disabled.');
}
void start().catch(error=>status(niceError(error),true));
