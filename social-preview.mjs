// Original page-specific social images. Apply after generated HTML so previews survive rebuilds.
const entries = {
  "index.html": [
    "assets/amira-portrait.jpg",
    "Amira Abdelfadil — Film & Art",
    "أميرة عبد الفضيل — سينما وفن",
    "Films, photography and writing by Cairo-based filmmaker and visual artist Amira Abdelfadil.",
    "أفلام وتصوير وكتابات صانعة الأفلام والفنانة البصرية أميرة عبد الفضيل.",
    "Amira holding a camera",
    "أميرة تحمل كاميرا"
  ],
  "film-biophilia.html": [
    "assets/biophilia-01.jpg",
    "Biophilia",
    "بيوفيليا"
  ],
  "film-double-edged-sword.html": [
    "assets/double-edged-sword-01.jpg",
    "A Double-Edged Sword",
    "سيف ذو حدين"
  ],
  "film-mamina.html": [
    "assets/mamina-01.jpg",
    "Mamina",
    "مامينا"
  ],
  "film-street-x-food.html": [
    "assets/street-x-food-01.jpg",
    "Street X Food",
    "ستريت إكس فود"
  ],
  "film-sweet-and-salty.html": [
    "assets/sweet-and-salty-01.jpg",
    "Sweet & Salty",
    "حلو ومالح"
  ],
  "writing.html": [
    "assets/days-with-amira/memory-10.jpg",
    "Writing",
    "الكتابة",
    "A collection of essays on memory, identity, the creative process and taking chances.",
    "مجموعة مقالات عن الذاكرة والهوية والعملية الإبداعية وخوض التجارب.",
    "Printed photographs arranged on a table",
    "صور مطبوعة موزعة على طاولة"
  ],
  "days-with-amira.html": [
    "assets/days-with-amira/memory-28.jpg",
    "Days with Amira",
    "أيام مع أميرة",
    "A visual diary of the people, places and small moments around the work.",
    "يوميات بصرية تجمع الأشخاص والأماكن واللحظات الصغيرة التي تحيط بالعمل.",
    "A camera reflected in a green window",
    "انعكاس كاميرا في نافذة خضراء"
  ],
  "beyond-the-frame.html": [
    "assets/days-with-amira/memory-25.jpg",
    "Beyond the Frame",
    "خارج الإطار",
    "A space for the ideas, creative practice and quieter stories beyond the cinematic frame.",
    "مساحة للأفكار والممارسة الإبداعية والحكايات الهادئة خارج الإطار السينمائي.",
    "A camera and lights during a studio shoot",
    "كاميرا وإضاءة أثناء التصوير في الاستوديو"
  ]
};
export function applySocialPreview(html,file,ar){
 const entry=entries[file];if(!entry)return completeSocialPreview(html,ar);
 const [asset,en,arabic,descEn,descAr,altEn,altAr]=entry;
 const name=ar?arabic:en,brand=ar?'أميرة عبد الفضيل':'Amira Abdelfadil';
 const title=file==='index.html'?name:name+' | '+brand;
 const desc=(ar?descAr:descEn)||(ar?'شاهد الملصق واللقطات وفريق العمل لفيلم '+name+'.':'Explore the original poster, film stills and production credits for '+name+'.');
 const alt=(ar?altAr:altEn)||(ar?'لقطة من فيلم '+name:'Film still from '+name);
 const origin='https://amiraabdelfadil.com/';
 const url=origin+(ar?'ar/':'')+(file==='index.html'?'':file.replace(/\.html$/,''));
 const image=origin+asset;
 const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const property={'og:type':'website','og:locale':ar?'ar_EG':'en_GB','og:locale:alternate':ar?'en_GB':'ar_EG','og:site_name':brand,'og:url':url,'og:title':title,'og:description':desc,'og:image':image,'og:image:type':'image/jpeg','og:image:alt':alt};
 const names={'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':desc,'twitter:image':image,'twitter:image:alt':alt};
 const tags=[...Object.entries(property).map(([k,v])=>'<meta property="'+k+'" content="'+esc(v)+'">'),...Object.entries(names).map(([k,v])=>'<meta name="'+k+'" content="'+esc(v)+'">')].join('\n');
 return html.replace(/<meta\b[^>]*(?:property|name)=["'](?:og:|twitter:)[^"']+["'][^>]*>/gi,'').replace(/<\/head>/i,'\n'+tags+'\n</head>');
}

// Complete public-page previews without replacing an author's chosen image or copy.
// Private pages and dynamic CMS shells have no public canonical preview here.
function completeSocialPreview(html,ar){
 const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];if(!head)return html;
 const attr=(tag,name)=>tag.match(new RegExp('\\b'+name+'\\s*=\\s*(["\'])(.*?)\\1','i'))?.[2];
 const metas=[...head.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
 const meta=name=>metas.find(tag=>(attr(tag,'property')||attr(tag,'name'))?.toLowerCase()===name);
 if(/noindex/i.test(attr(meta('robots')||'','content')||''))return html;
 const canonical=[...head.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]).find(tag=>attr(tag,'rel')==='canonical');
 const url=attr(canonical||'','href'),title=head.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
 const description=attr(meta('description')||'','content');
 if(!url||!title||!description)return html;
 const existing=name=>attr(meta(name)||'','content');
 const image=existing('og:image')||'https://amiraabdelfadil.com/assets/amira-portrait.jpg';
 const imageAlt=existing('og:image:alt')||(existing('og:image')?(ar?'أعمال أميرة عبد الفضيل':'Work by Amira Abdelfadil'):(ar?'أميرة عبد الفضيل تحمل كاميرا':'Amira holding a camera'));
 const properties={'og:type':'website','og:locale':ar?'ar_EG':'en_GB','og:locale:alternate':ar?'en_GB':'ar_EG','og:site_name':ar?'أميرة عبد الفضيل':'Amira Abdelfadil','og:url':url,'og:title':title,'og:description':description,'og:image':image,'og:image:alt':imageAlt};
 const names={'twitter:card':'summary_large_image','twitter:title':existing('og:title')||title,'twitter:description':existing('og:description')||description,'twitter:image':image,'twitter:image:alt':imageAlt};
 // Values already come from HTML attributes or title text; preserve entities.
 const safe=value=>value.replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const tags=[...Object.entries(properties).filter(([key])=>!meta(key)).map(([key,value])=>'<meta property="'+key+'" content="'+safe(value)+'">'),...Object.entries(names).filter(([key])=>!meta(key)).map(([key,value])=>'<meta name="'+key+'" content="'+safe(value)+'">')].join('\n');
 return tags?html.replace(/<\/head>/i,'\n'+tags+'\n</head>'):html;
}
