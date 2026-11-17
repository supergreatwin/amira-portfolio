export const site = {
  name: 'Amira Abdelfadil',
  email: 'byamira01@gmail.com',
  url: 'https://amiraabdelfadil.pages.dev/',
  description: 'Films, visual work, and writing by Amira Abdelfadil, an Egyptian filmmaker, photographer, and multidisciplinary artist based in Cairo.',
  socials: [
    { id: 'instagram', name: 'Instagram', profile: '@amiraabdelfadil', label: 'Visual Diary', url: 'https://www.instagram.com/amiraabdelfadil/' },
    { id: 'linkedin', name: 'LinkedIn', profile: 'Amira Abdelfadil', label: 'Professional Connections', url: 'https://www.linkedin.com/in/amira-a-4a9b73113/' },
  ],
};

export const locales = {
  en: {
    lang: 'en', dir: 'ltr', ogLocale: 'en_US',
    navigation: [
      ['Home', '#top'], ['Films', '#work'], ['Art & Photography', 'art.html'],
      ['Writing', 'writing.html'], ['Collaborations', 'collaborations.html'], ['About', 'about.html'], ['Contact', 'contact.html'],
    ],
  },
  ar: {
    lang: 'ar', dir: 'rtl', ogLocale: 'ar_EG',
    navigation: [
      ['الرئيسية', '#top'], ['الأفلام', '#work'], ['الفن والتصوير', 'art.html'],
      ['كتابات', '#writing'], ['التعاونات', 'collaborations.html'], ['نبذة', '#about'], ['تواصل', 'contact.html'],
    ],
  },
};

const productionPartners = 'IMS, Nazra Films, Goethe Institute, Red Star';
const productionPartnersAr = 'آي إم إس، نظرة فيلمز، معهد غوته، وريد ستار';

export const films = [
  {
    id: 'sweet-and-salty', title: 'Sweet & Salty', posterWidth: 636, seconds: 2483,
    excerpt: 'Two strangers in Cairo pursue dreams rooted in their love of food.',
    synopsis: 'From the heart of Cairo, Nabil and Somaya are strangers pursuing dreams rooted in their love of food. Though their paths are different, their stories echo one another. Each navigates the delicate space between ambition and circumstance, shaped by memory, sacrifice, and the people who surround them.',
    credits: [['Co-directed by', 'Amira Abdel-Fadil & Sarah El Halawany'], ['Production', 'Nazra Films, Goethe Institute, IMS, Red Star']],
    creditsAr: [['إخراج مشترك', 'أميرة عبد الفضيل وسارة الحلواني'], ['الإنتاج', 'نظرة فيلمز، معهد غوته، آي إم إس، وريد ستار']],
    stills: [
      ['sweet-and-salty-01.jpg', 1440, 790, 'Somaya laughing at a table'],
      ['sweet-and-salty-02.jpg', 1440, 686, 'A chocolate pastry with a pink candle'],
      ['sweet-and-salty-03.jpg', 1440, 735, 'A cook stirring a dish on the stovetop'],
      ['sweet-and-salty-04.jpg', 1440, 1130, 'Nabil laughing at a night market'],
    ],
  },
  {
    id: 'street-x-food', title: 'Street X Food', posterWidth: 707, seconds: 348,
    excerpt: 'A glimpse into Cairo’s vibrant street life through its street vendors, cooks, and the people who gather around their meals.',
    synopsis: 'Street X Food is a glimpse into Cairo’s vibrant street life, where food pulses like a heartbeat. Through its street vendors, cooks, and the people who gather around their meals, the film captures the flavours, energy, and everyday connections of a city shaped by resilience and community.',
    credits: [['Director', 'Amira Abdel-Fadil'], ['Production', productionPartners]],
    creditsAr: [['الإخراج', 'أميرة عبد الفضيل'], ['الإنتاج', productionPartnersAr]],
    stills: [
      ['street-x-food-01.jpg', 1120, 573, 'A pan of food at a street food stand'],
      ['street-x-food-02.jpg', 1120, 571, 'Two men seated in a market street'],
      ['street-x-food-03.jpg', 1120, 573, 'Birds perched along a steel structure against a blue sky'],
      ['street-x-food-04.jpg', 1120, 574, 'The Nile and a palm-lined bank in daylight'],
    ],
  },
  {
    id: 'biophilia', title: 'Biophilia', posterWidth: 607, genre: 'Collaborative documentary', year: 2023, seconds: 1793,
    trailer: { youtubeId: '2z-i75VBvSY', titleAr: 'بيوفيليا' },
    excerpt: 'A closer look at the nature that persists amid the noise of urban life.',
    synopsis: 'In this increasingly fast-paced world, especially in big urban cities, everything is becoming man-made, and we indulge and indulge. Every once in a while, if we’re lucky enough, we get to turn the volume down and be humbled by the greatest artist: nature. It has the ability to remind us of what is real and natural amidst the noise. This is an open invitation to embrace the beauty of nature in urban spaces, notice what it can be despite endless urbanization, and become one with it. While everything manufactured can seem like a feat of genius, nature, too, deserves to be celebrated and embraced.',
    credits: [['Co-directors', 'Amira Abdel-Fadil, Rama Abdi, and Kateřina Sivoková'], ['Production', 'Duemila30 Productions']],
    creditsAr: [['إخراج مشترك', 'أميرة عبد الفضيل، راما عبدي، وكاترينا سيفوكوفا'], ['الإنتاج', 'دويميلا 30 للإنتاج']],
    stills: [
      ['biophilia-01.jpg', 1120, 563, 'A tree and a green cart along an urban road'],
      ['biophilia-02.jpg', 1120, 652, 'A person in blue looking down a narrow city street'],
      ['biophilia-03.jpg', 1120, 630, 'A goat with a city in the distance'],
      ['biophilia-04.jpg', 1440, 810, 'Two people sitting among the branches of a tree'],
    ],
  },
  {
    id: 'mamina', title: 'Mamina', posterWidth: 637, genre: 'Short documentary', year: 2025, seconds: 885,
    trailer: { youtubeId: '9-ksBDgAwFk', titleAr: 'مامينا' },
    excerpt: 'After losing her grandmother, Amira returns to the memories they made together in her kitchen.',
    synopsis: 'Amira, a young woman deeply attached to her grandmother, is struggling to cope with her loss. Their bond was nurtured in her grandmother’s kitchen through cooking and sharing meals together. Now, without her grandmother’s abundant love, Amira feels lost and misses her terribly. As she grieves and searches for love in those around her, including her mother, and within herself, she begins to uncover what might be the key to moving forward despite the pain.',
    credits: [['Director', 'Amira Abdel-Fadil'], ['Production', productionPartners]],
    creditsAr: [['الإخراج', 'أميرة عبد الفضيل'], ['الإنتاج', productionPartnersAr]],
    stills: [
      ['mamina-01.jpg', 1120, 578, 'A pot and pan on a kitchen stove'],
      ['mamina-02.jpg', 1344, 709, 'Two women talk on a balcony overlooking Cairo'],
      ['mamina-03.jpg', 1120, 624, 'Two people in bright clothes lying in grass'],
      ['mamina-04.jpg', 992, 1080, 'An old portrait of Amira’s grandmother wearing a headscarf'],
    ],
  },
  {
    id: 'double-edged-sword', title: 'A Double-Edged Sword', posterWidth: 636, genre: 'Short documentary', year: 2023, seconds: 795,
    trailer: { youtubeId: 'LlEB9mEAB_Y', titleAr: 'سيف ذو حدين' },
    excerpt: 'How food waste in the supply chain connects to hunger and climate change.',
    synopsis: 'A short documentary about food waste in the food chain and its link to climate change and hunger.',
    credits: [['Director', 'Amira Abdel-Fadil'], ['Producer', 'Amira Abdel-Fadil']],
    creditsAr: [['الإخراج', 'أميرة عبد الفضيل'], ['الإنتاج', 'أميرة عبد الفضيل']],
    stills: [
      ['double-edged-sword-01.jpg', 1120, 653, 'A person in a red shirt lying in grass'],
      ['double-edged-sword-02.jpg', 1120, 648, 'A person working among rows of crops'],
      ['double-edged-sword-03.jpg', 1120, 662, 'Cattle in a dry field'],
      ['double-edged-sword-04.jpg', 1370, 743, 'A fire burning beside a field lined with palm trees'],
    ],
  },
];

export const collaborations = [
  {
    title: 'Sweet & Salty', titleAr: 'حلو وحادق',
    description: 'Co-directed with Sarah El Halawany. Production credits include Nazra Films, Goethe Institute, IMS, and Red Star.',
    descriptionAr: 'إخراج مشترك مع سارة الحلواني. وتضم جهات الإنتاج نظرة فيلمز، ومعهد غوته، وآي إم إس، وريد ستار.',
  },
  {
    title: 'Biophilia', titleAr: 'بيوفيليا',
    description: 'Made with Rama Abdi and Kateřina Sivoková through Duemila30 Productions.',
    descriptionAr: 'أُنجز الفيلم بالتعاون مع راما عبدي وكاتِرينا سيفوكوفا، ومن إنتاج دويميلا ترينتا.',
    url: 'https://www.duemila30.com/production/biophilia',
  },
  {
    title: 'Mamina', titleAr: 'مامينا',
    description: 'Production: IMS, Nazra Films, Goethe Institute, and Red Star. Cinematography by Menna Ahmed, editing by Hisham Abdelrazek, and sound by Mohab Ezz.',
    descriptionAr: 'الإنتاج: آي إم إس، ونظرة فيلمز، ومعهد غوته، وريد ستار. تصوير منّة أحمد، ومونتاج هشام عبد الرازق، وتصميم ومزج الصوت لمهاب عز.',
  },
  {
    title: 'A Double-Edged Sword', titleAr: 'سيف ذو حدين',
    description: 'Co-written with Magda Baraka, who also appears in the film. Sound design and mixing with Khaled Saleh.',
    descriptionAr: 'كتبت أميرة الفيلم بالاشتراك مع ماجدة بركة، التي تظهر فيه أيضًا، وتعاونت مع خالد صالح في تصميم الصوت ومزجه.',
  },
  {
    title: 'Outside the Frame', titleAr: 'بره الكادر',
    description: 'Played Raghda in the short film.',
    descriptionAr: 'أدّت دور رغدة في الفيلم القصير.',
  },
  {
    title: 'Netsharek', titleAr: 'نتشارك',
    description: 'Edited and refined a food-management project for students at the University of Hull and the Arab Academy for Science, Technology and Maritime Transport.',
    descriptionAr: 'شاركت في تحرير ومراجعة مشروع عن إدارة الطعام لطلاب جامعة هال والأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري.',
  },
  {
    title: 'ByAmirah', titleAr: 'ByAmirah',
    description: 'Works with Abdelrahman Mohamed on creative development, film marketing, research, and behind-the-scenes content.',
    descriptionAr: 'تتعاون مع عبد الرحمن محمد في تطوير الأفكار وتسويق الأفلام والبحث وتوثيق الكواليس.',
  },
  {
    title: 'Ismailia International Film Festival for Documentaries and Shorts', titleAr: 'مهرجان الإسماعيلية الدولي للأفلام التسجيلية والقصيرة',
    description: 'Served as general coordinator.',
    descriptionAr: 'تولّت مهمة المنسّقة العامة للمهرجان.',
  },
  {
    title: 'Editorial contributions', titleAr: 'المساهمات التحريرية',
    description: 'Contributed to MovieWeb, Thought Catalog, Collective World, and Vertical Network.',
    descriptionAr: 'ساهمت في منصات MovieWeb وThought Catalog وCollective World وVertical Network.',
  },
];
