export interface Surah {
  id: number;
  name: string;
  nameArabic: string;
  translation: string;
  versesCount: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  number: number;
  arabic: string;
  translations: {
    english: string;
    urdu: string;
  };
}

export const SURAHS: Surah[] = [
  { id: 1, name: 'Al-Fatihah', nameArabic: 'الفاتحة', translation: 'The Opening', versesCount: 7, revelationType: 'Meccan' },
  { id: 2, name: 'Al-Baqarah', nameArabic: 'البقرة', translation: 'The Cow', versesCount: 286, revelationType: 'Medinan' },
  { id: 3, name: 'Ali Imran', nameArabic: 'آل عمران', translation: 'Family of Imran', versesCount: 200, revelationType: 'Medinan' },
  { id: 4, name: 'An-Nisa', nameArabic: 'النساء', translation: 'The Women', versesCount: 176, revelationType: 'Medinan' },
  { id: 5, name: 'Al-Ma\'idah', nameArabic: 'المائدة', translation: 'The Table Spread', versesCount: 120, revelationType: 'Medinan' },
  { id: 6, name: 'Al-An\'am', nameArabic: 'الأنعام', translation: 'The Cattle', versesCount: 165, revelationType: 'Meccan' },
  { id: 7, name: 'Al-A\'raf', nameArabic: 'الأعراف', translation: 'The Heights', versesCount: 206, revelationType: 'Meccan' },
  { id: 8, name: 'Al-Anfal', nameArabic: 'الأنفال', translation: 'The Spoils of War', versesCount: 75, revelationType: 'Medinan' },
  { id: 9, name: 'At-Tawbah', nameArabic: 'التوبة', translation: 'The Repentance', versesCount: 129, revelationType: 'Medinan' },
  { id: 10, name: 'Yunus', nameArabic: 'يونس', translation: 'Jonah', versesCount: 109, revelationType: 'Meccan' },
  { id: 36, name: 'Ya-Sin', nameArabic: 'يس', translation: 'Ya Sin', versesCount: 83, revelationType: 'Meccan' },
  { id: 55, name: 'Ar-Rahman', nameArabic: 'الرحمن', translation: 'The Most Merciful', versesCount: 78, revelationType: 'Medinan' },
  { id: 56, name: 'Al-Waqi\'ah', nameArabic: 'الواقعة', translation: 'The Inevitable', versesCount: 96, revelationType: 'Meccan' },
  { id: 67, name: 'Al-Mulk', nameArabic: 'الملك', translation: 'The Sovereignty', versesCount: 30, revelationType: 'Meccan' },
  { id: 72, name: 'Al-Jinn', nameArabic: 'الجن', translation: 'The Jinn', versesCount: 28, revelationType: 'Meccan' },
  { id: 73, name: 'Al-Muzzammil', nameArabic: 'المزمل', translation: 'The Enshrouded One', versesCount: 20, revelationType: 'Meccan' },
  { id: 78, name: 'An-Naba', nameArabic: 'النبأ', translation: 'The Tidings', versesCount: 40, revelationType: 'Meccan' },
  { id: 87, name: 'Al-A\'la', nameArabic: 'الأعلى', translation: 'The Most High', versesCount: 19, revelationType: 'Meccan' },
  { id: 93, name: 'Ad-Duhaa', nameArabic: 'الضحى', translation: 'The Morning Hours', versesCount: 11, revelationType: 'Meccan' },
  { id: 94, name: 'Ash-Sharh', nameArabic: 'الشرح', translation: 'The Relief', versesCount: 8, revelationType: 'Meccan' },
  { id: 95, name: 'At-Tin', nameArabic: 'التين', translation: 'The Fig', versesCount: 8, revelationType: 'Meccan' },
  { id: 96, name: 'Al-Alaq', nameArabic: 'العلق', translation: 'The Clot', versesCount: 19, revelationType: 'Meccan' },
  { id: 97, name: 'Al-Qadr', nameArabic: 'القدر', translation: 'The Power', versesCount: 5, revelationType: 'Meccan' },
  { id: 99, name: 'Az-Zalzalah', nameArabic: 'الزلزلة', translation: 'The Earthquake', versesCount: 8, revelationType: 'Medinan' },
  { id: 100, name: 'Al-Adiyat', nameArabic: 'العاديات', translation: 'The Coursers', versesCount: 11, revelationType: 'Meccan' },
  { id: 101, name: 'Al-Qari\'ah', nameArabic: 'القارعة', translation: 'The Calamity', versesCount: 11, revelationType: 'Meccan' },
  { id: 102, name: 'At-Takathur', nameArabic: 'التكاثر', translation: 'The Rivalry', versesCount: 8, revelationType: 'Meccan' },
  { id: 103, name: 'Al-Asr', nameArabic: 'العصر', translation: 'The Declining Day', versesCount: 3, revelationType: 'Meccan' },
  { id: 104, name: 'Al-Humazah', nameArabic: 'الهمزة', translation: 'The Traducer', versesCount: 9, revelationType: 'Meccan' },
  { id: 105, name: 'Al-Fil', nameArabic: 'الفيل', translation: 'The Elephant', versesCount: 5, revelationType: 'Meccan' },
  { id: 106, name: 'Quraysh', nameArabic: 'قريش', translation: 'Quraysh', versesCount: 4, revelationType: 'Meccan' },
  { id: 107, name: 'Al-Ma\'un', nameArabic: 'الماعون', translation: 'The Small Kindnesses', versesCount: 7, revelationType: 'Meccan' },
  { id: 108, name: 'Al-Kawthar', nameArabic: 'الكوثر', translation: 'The Abundance', versesCount: 3, revelationType: 'Meccan' },
  { id: 109, name: 'Al-Kafirun', nameArabic: 'الكافرون', translation: 'The Disbelievers', versesCount: 6, revelationType: 'Meccan' },
  { id: 110, name: 'An-Nasr', nameArabic: 'النصر', translation: 'The Divine Support', versesCount: 3, revelationType: 'Medinan' },
  { id: 111, name: 'Al-Masad', nameArabic: 'المسد', translation: 'The Palm Fiber', versesCount: 5, revelationType: 'Meccan' },
  { id: 112, name: 'Al-Ikhlas', nameArabic: 'الإخلاص', translation: 'The Sincerity', versesCount: 4, revelationType: 'Meccan' },
  { id: 113, name: 'Al-Falaq', nameArabic: 'الفلق', translation: 'The Daybreak', versesCount: 5, revelationType: 'Meccan' },
  { id: 114, name: 'An-Nas', nameArabic: 'الناس', translation: 'Mankind', versesCount: 6, revelationType: 'Meccan' },
];

export const SURAH_DATA: Record<number, Ayah[]> = {
  1: [
    { number: 1, arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translations: { english: 'In the name of Allah, the Most Gracious, the Most Merciful', urdu: 'اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے' } },
    { number: 2, arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', translations: { english: 'All praise is due to Allah, Lord of the worlds', urdu: 'سب تعریف اللہ کے لیے ہے جو تمام جہانوں کا پالنے والا ہے' } },
    { number: 3, arabic: 'الرَّحْمَٰنِ الرَّحِيمِ', translations: { english: 'The Most Gracious, the Most Merciful', urdu: 'بڑا مہربان نہایت رحم والا' } },
    { number: 4, arabic: 'مَالِكِ يَوْمِ الدِّينِ', translations: { english: 'Master of the Day of Judgment', urdu: 'روز جزا کا مالک' } },
    { number: 5, arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', translations: { english: 'You alone we worship, and You alone we ask for help', urdu: 'ہم تیری ہی عبادت کرتے ہیں اور تجھ ہی سے مدد مانگتے ہیں' } },
    { number: 6, arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', translations: { english: 'Guide us to the straight path', urdu: 'ہمیں سیدھا راستہ دکھا' } },
    { number: 7, arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', translations: { english: 'The path of those upon whom You have bestowed favor, not of those who have earned anger nor of those who are astray', urdu: 'ان لوگوں کا راستہ جن پر تو نے انعام فرمایا، نہ ان کا جن پر غضب ہوا اور نہ گمراہوں کا' } },
  ],
  112: [
    { number: 1, arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translations: { english: 'Say, "He is Allah, the One"', urdu: 'کہو وہ اللہ ایک ہے' } },
    { number: 2, arabic: 'اللَّهُ الصَّمَدُ', translations: { english: 'Allah, the Eternal Refuge', urdu: 'اللہ بے نیاز ہے' } },
    { number: 3, arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', translations: { english: 'He neither begets nor is born', urdu: 'نہ اس کی کوئی اولاد ہے اور نہ وہ کسی کی اولاد ہے' } },
    { number: 4, arabic: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', translations: { english: 'Nor is there to Him any equivalent', urdu: 'اور کوئی اس کا ہمسر نہیں' } },
  ],
  113: [
    { number: 1, arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', translations: { english: 'Say, "I seek refuge in the Lord of daybreak"', urdu: 'کہو میں صبح کے رب کی پناہ مانگتا ہوں' } },
    { number: 2, arabic: 'مِن شَرِّ مَا خَلَقَ', translations: { english: 'From the evil of that which He created', urdu: 'ہر اس چیز کے شر سے جو اس نے پیدا کی' } },
    { number: 3, arabic: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', translations: { english: 'And from the evil of darkness when it settles', urdu: 'اور اندھیری رات کے شر سے جب وہ چھا جائے' } },
    { number: 4, arabic: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ', translations: { english: 'And from the evil of the blowers in knots', urdu: 'اور گرہوں میں پھونکنے والیوں کے شر سے' } },
    { number: 5, arabic: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', translations: { english: 'And from the evil of an envier when he envies', urdu: 'اور حسد کرنے والے کے شر سے جب وہ حسد کرے' } },
  ],
  114: [
    { number: 1, arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', translations: { english: 'Say, "I seek refuge in the Lord of mankind"', urdu: 'کہو میں لوگوں کے رب کی پناہ مانگتا ہوں' } },
    { number: 2, arabic: 'مَلِكِ النَّاسِ', translations: { english: 'The Sovereign of mankind', urdu: 'لوگوں کے بادشاہ کی' } },
    { number: 3, arabic: 'إِلَٰهِ النَّاسِ', translations: { english: 'The God of mankind', urdu: 'لوگوں کے معبود کی' } },
    { number: 4, arabic: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', translations: { english: 'From the evil of the retreating whisperer', urdu: 'پیچھے ہٹ جانے والے وسوسہ ڈالنے والے کے شر سے' } },
    { number: 5, arabic: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', translations: { english: 'Who whispers in the breasts of mankind', urdu: 'جو لوگوں کے دلوں میں وسوسہ ڈالتا ہے' } },
    { number: 6, arabic: 'مِنَ الْجِنَّةِ وَالنَّاسِ', translations: { english: 'From among the jinn and mankind', urdu: 'خواہ وہ جنوں میں سے ہو یا انسانوں میں سے' } },
  ],
  103: [
    { number: 1, arabic: 'وَالْعَصْرِ', translations: { english: 'By time', urdu: 'زمانے کی قسم' } },
    { number: 2, arabic: 'إِنَّ الْإِنسَانَ لَفِي خُسْرٍ', translations: { english: 'Indeed, mankind is in loss', urdu: 'بیشک انسان خسارے میں ہے' } },
    { number: 3, arabic: 'إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ', translations: { english: 'Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience', urdu: 'سوائے ان لوگوں کے جو ایمان لائے اور نیک عمل کیے اور ایک دوسرے کو حق کی تلقین کی اور صبر کی نصیحت کی' } },
  ],
  108: [
    { number: 1, arabic: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ', translations: { english: 'Indeed, We have granted you Al-Kawthar', urdu: 'بیشک ہم نے تمہیں کوثر عطا کی' } },
    { number: 2, arabic: 'فَصَلِّ لِرَبِّكَ وَانْحَرْ', translations: { english: 'So pray to your Lord and sacrifice', urdu: 'پس اپنے رب کے لیے نماز پڑھو اور قربانی کرو' } },
    { number: 3, arabic: 'إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ', translations: { english: 'Indeed, your enemy is the one cut off', urdu: 'بیشک تمہارا دشمن ہی بے نام و نشان ہے' } },
  ],
};
