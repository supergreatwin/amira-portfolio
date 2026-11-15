const italy = [
  ['A photographer reflected behind a window grille', 'انعكاس مصوّرة خلف قضبان نافذة'],
  ['Terracotta rooftops overlooking a blue bay', 'أسطح قرميدية تطل على خليج أزرق'],
  ['Lemons in wicker baskets beside handwritten signs', 'ليمون في سلال من الخوص بجوار لافتات مكتوبة بخط اليد'],
  ['A striped green awning shading a balcony with flowers', 'مظلّة خضراء مخططة تظلّل شرفة مزهرة'],
  ['A person seated under a white awning on a balcony', 'شخص يجلس في شرفة تحت مظلّة بيضاء'],
  ['A tiled dome against blue sky and distant hills', 'قبّة من القرميد على خلفية السماء الزرقاء والتلال البعيدة'],
  ['A stone giant supporting a ledge against a cliff', 'تمثال عملاق من الحجر يحمل حافةً عند جرف صخري'],
  ['A person in a straw hat walks through a stone doorway toward the sea', 'شخص بقبّعة من القش يعبر مدخلًا حجريًا باتجاه البحر'],
  ['A wooded hillside framed by a stone arch', 'سفح مكسوّ بالأشجار يظهر عبر قوس حجري'],
  ['A red lifeguard chair and umbrella beside swimmers', 'كرسي إنقاذ ومظلّة باللون الأحمر قرب سبّاحين'],
  ['Pigeons on ledges beneath an arched green window', 'حمام يقف على حوافّ حجريّة أسفل نافذة خضراء مقوّسة'],
  ['A waterfront hotel below a bay dotted with yachts', 'فندق على الواجهة البحريّة وخلفه خليج تنتشر فيه اليخوت'],
  ['Green shutters and red flowers on a sunlit ochre façade', 'مصاريع خضراء وزهور حمراء على واجهة مغرة تغمرها الشمس'],
  ['Two people bend down at the water’s edge near a moored boat', 'شخصان ينحنيان عند حافّة الماء بالقرب من قارب راسٍ'],
  ['A gull in front of blue-green shutters and a terracotta wall', 'نورس أمام مصاريع زرقاء مخضرّة وجدار بلون الطين'],
  ['Stone steps leading past pink fabric hung above a passage', 'درجات حجريّة تصعد بمحاذاة قماش وردي معلّق فوق ممرّ'],
  ['A lantern hanging between stone buildings with the sea beyond', 'فانوس معلّق بين مبانٍ حجريّة يظهر البحر من ورائها'],
  ['Two people at the edge of the waves on a pebble beach', 'شخصان عند حافّة الأمواج على شاطئ من الحصى'],
  ['A stack of smooth pebbles in front of breaking surf', 'حصى أملس مرصوص أمام أمواج متكسّرة'],
  ['Green shutters above an ochre arch opening onto the sea', 'مصاريع خضراء فوق قوس أصفر يطل على البحر'],
  ['Two gulls near a pale cliff under a vivid blue sky', 'نورسان قرب جرف فاتح تحت سماء زرقاء صافية'],
  ['Beachgoers seen from a low angle near the shore', 'روّاد الشاطئ قرب الماء كما يظهرون من زاوية منخفضة'],
  ['Pedestrians on a tree-lined street with sunlit buildings', 'مشاة في شارع تصطفّ الأشجار على جانبيه وتضيء الشمس مبانيه'],
];

export function italyPhotos(arabic) {
  return italy.map(([englishAlt, arabicAlt], index) => [
    `photography/italy/${String(index + 1).padStart(2, '0')}.jpg`,
    720, 1280, arabic ? arabicAlt : englishAlt,
  ]);
}
