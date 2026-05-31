export interface AzkarCategory {
  id: string;
  name: string;
  nameArabic: string;
  icon: string;
  count: number;
  color: string;
}

export interface DhikrItem {
  id: string;
  categoryId: string;
  arabic: string;
  translation: string;
  transliteration: string;
  repeat: number;
  reference: string;
}

export const AZKAR_CATEGORIES: AzkarCategory[] = [
  { id: 'morning', name: 'Morning Adhkar', nameArabic: 'أذكار الصباح', icon: 'sunny-outline', count: 8, color: '#FCD34D' },
  { id: 'evening', name: 'Evening Adhkar', nameArabic: 'أذكار المساء', icon: 'moon-outline', count: 8, color: '#818CF8' },
  { id: 'after-salah', name: 'After Salah', nameArabic: 'أذكار بعد الصلاة', icon: 'hand-left-outline', count: 6, color: '#34D399' },
  { id: 'sleep', name: 'Before Sleep', nameArabic: 'أذكار النوم', icon: 'bed-outline', count: 5, color: '#6366F1' },
  { id: 'wakeup', name: 'Upon Waking', nameArabic: 'أذكار الاستيقاظ', icon: 'alarm-outline', count: 4, color: '#F97316' },
  { id: 'travel', name: 'Travel Duas', nameArabic: 'أدعية السفر', icon: 'airplane-outline', count: 4, color: '#06B6D4' },
  { id: 'food', name: 'Food & Drink', nameArabic: 'أذكار الطعام', icon: 'restaurant-outline', count: 4, color: '#F43F5E' },
  { id: 'protection', name: 'Protection', nameArabic: 'أذكار الحماية', icon: 'shield-outline', count: 5, color: '#8B5CF6' },
  { id: 'ramadan', name: 'Fasting (Ramadan)', nameArabic: 'أذكار الصيام', icon: 'moon-outline', count: 3, color: '#10B981' },
  { id: 'hajj', name: 'Hajj & Umrah', nameArabic: 'الحج والعمرة', icon: 'cube-outline', count: 4, color: '#14B8A6' },
  { id: 'family', name: 'Family & Home', nameArabic: 'الأسرة والمنزل', icon: 'home-outline', count: 3, color: '#F59E0B' },
  { id: 'nature', name: 'Rain & Weather', nameArabic: 'المطر والطقس', icon: 'rainy-outline', count: 2, color: '#3B82F6' },
];
export const AZKAR_ITEMS: DhikrItem[] = [
  // Morning Adhkar
  { id: 'm1', categoryId: 'morning', arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', translation: 'We have reached the morning and at this very time the whole kingdom belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah alone.', transliteration: 'Asbahna wa asbahal mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah', repeat: 1, reference: 'Muslim' },
  { id: 'm2', categoryId: 'morning', arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ', translation: 'O Allah, by Your leave we have reached the morning and by Your leave we have reached the evening, by Your leave we live and die and unto You is our resurrection.', transliteration: 'Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu, wa ilaykan-nushur', repeat: 1, reference: 'Tirmidhi' },
  { id: 'm3', categoryId: 'morning', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', translation: 'Glory is to Allah and praise is to Him.', transliteration: 'SubhanAllahi wa bihamdihi', repeat: 100, reference: 'Muslim' },
  { id: 'm4', categoryId: 'morning', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', translation: 'None has the right to be worshipped except Allah alone, without partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent.', transliteration: 'La ilaha illallahu wahdahu la sharika lah, lahul mulku wa lahul hamdu wa huwa ala kulli shayin qadir', repeat: 10, reference: 'Bukhari & Muslim' },
  { id: 'm5', categoryId: 'morning', arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', translation: 'I seek refuge in the perfect words of Allah from the evil of what He has created.', transliteration: 'A\'udhu bikalimatillahit-tammati min sharri ma khalaq', repeat: 3, reference: 'Muslim' },
  { id: 'm6', categoryId: 'morning', arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ', translation: 'In the name of Allah with whose name nothing is harmed on earth nor in the heavens and He is the All-Hearing, the All-Knowing.', transliteration: 'Bismillahil-ladhi la yadurru ma\'asmihi shay\'un fil-ardi wa la fis-sama\'i wa huwas-Sami\'ul-\'Alim', repeat: 3, reference: 'Abu Dawud & Tirmidhi' },
  { id: 'm7', categoryId: 'morning', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ', translation: 'O Allah, I ask You for well-being in this world and the hereafter.', transliteration: 'Allahumma inni as\'alukal-\'afiyata fid-dunya wal-akhirah', repeat: 3, reference: 'Abu Dawud & Ibn Majah' },
  { id: 'm8', categoryId: 'morning', arabic: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ', translation: 'Allah is sufficient for me. There is no god but He. I have placed my trust in Him, He is Lord of the Majestic Throne.', transliteration: 'Hasbiyallahu la ilaha illa Huwa alayhi tawakkaltu wa Huwa Rabbul-Arshil-Adhim', repeat: 7, reference: 'Abu Dawud' },

  // Evening Adhkar
  { id: 'e1', categoryId: 'evening', arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', translation: 'We have reached the evening and at this very time the whole kingdom belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah alone.', transliteration: 'Amsayna wa amsal mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah', repeat: 1, reference: 'Muslim' },
  { id: 'e2', categoryId: 'evening', arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ', translation: 'O Allah, by Your leave we have reached the evening and by Your leave we have reached the morning, by Your leave we live and die and unto You is our return.', transliteration: 'Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namutu, wa ilaykal-masir', repeat: 1, reference: 'Tirmidhi' },
  { id: 'e3', categoryId: 'evening', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', translation: 'Glory is to Allah and praise is to Him.', transliteration: 'SubhanAllahi wa bihamdihi', repeat: 100, reference: 'Muslim' },
  { id: 'e4', categoryId: 'evening', arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', translation: 'I seek refuge in the perfect words of Allah from the evil of what He has created.', transliteration: 'A\'udhu bikalimatillahit-tammati min sharri ma khalaq', repeat: 3, reference: 'Muslim' },
  { id: 'e5', categoryId: 'evening', arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ', translation: 'In the name of Allah with whose name nothing is harmed on earth nor in the heavens and He is the All-Hearing, the All-Knowing.', transliteration: 'Bismillahil-ladhi la yadurru ma\'asmihi shay\'un fil-ardi wa la fis-sama\'i wa huwas-Sami\'ul-\'Alim', repeat: 3, reference: 'Abu Dawud & Tirmidhi' },
  { id: 'e6', categoryId: 'evening', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ', translation: 'O Allah, I ask You for well-being in this world and the hereafter.', transliteration: 'Allahumma inni as\'alukal-\'afiyata fid-dunya wal-akhirah', repeat: 3, reference: 'Abu Dawud & Ibn Majah' },
  { id: 'e7', categoryId: 'evening', arabic: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ', translation: 'Allah is sufficient for me. There is no god but He. I have placed my trust in Him, He is Lord of the Majestic Throne.', transliteration: 'Hasbiyallahu la ilaha illa Huwa alayhi tawakkaltu wa Huwa Rabbul-Arshil-Adhim', repeat: 7, reference: 'Abu Dawud' },
  { id: 'e8', categoryId: 'evening', arabic: 'اللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ', translation: 'O Allah, Knower of the unseen and the seen, Creator of the heavens and the earth.', transliteration: 'Allahumma \'Alimal-ghaybi wash-shahadati fatiras-samawati wal-ard', repeat: 1, reference: 'Tirmidhi' },

  // After Salah
  { id: 'as1', categoryId: 'after-salah', arabic: 'أَسْتَغْفِرُ اللَّهَ', translation: 'I seek forgiveness from Allah.', transliteration: 'Astaghfirullah', repeat: 3, reference: 'Muslim' },
  { id: 'as2', categoryId: 'after-salah', arabic: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', translation: 'O Allah, You are Peace and from You is peace. Blessed are You, O Possessor of Majesty and Honor.', transliteration: 'Allahumma antas-Salamu wa minkas-salam, tabarakta ya Dhal-Jalali wal-Ikram', repeat: 1, reference: 'Muslim' },
  { id: 'as3', categoryId: 'after-salah', arabic: 'سُبْحَانَ اللَّهِ', translation: 'Glory be to Allah.', transliteration: 'SubhanAllah', repeat: 33, reference: 'Muslim' },
  { id: 'as4', categoryId: 'after-salah', arabic: 'الْحَمْدُ لِلَّهِ', translation: 'All praise is for Allah.', transliteration: 'Alhamdulillah', repeat: 33, reference: 'Muslim' },
  { id: 'as5', categoryId: 'after-salah', arabic: 'اللَّهُ أَكْبَرُ', translation: 'Allah is the Greatest.', transliteration: 'Allahu Akbar', repeat: 34, reference: 'Muslim' },
  { id: 'as6', categoryId: 'after-salah', arabic: 'آيَةُ الْكُرْسِيِّ', translation: 'Ayatul Kursi - Whoever recites this after every obligatory prayer, nothing prevents him from entering Paradise except death.', transliteration: 'Ayatul Kursi', repeat: 1, reference: 'Nasai' },

  // Before Sleep
  { id: 'sl1', categoryId: 'sleep', arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', translation: 'In Your name, O Allah, I die and I live.', transliteration: 'Bismika Allahumma amutu wa ahya', repeat: 1, reference: 'Bukhari' },
  { id: 'sl2', categoryId: 'sleep', arabic: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ', translation: 'O Allah, save me from Your punishment on the Day You resurrect Your servants.', transliteration: 'Allahumma qini \'adhabaka yawma tab\'athu \'ibadak', repeat: 3, reference: 'Abu Dawud' },
  { id: 'sl3', categoryId: 'sleep', arabic: 'سُبْحَانَ اللَّهِ', translation: 'Glory be to Allah.', transliteration: 'SubhanAllah', repeat: 33, reference: 'Bukhari & Muslim' },
  { id: 'sl4', categoryId: 'sleep', arabic: 'الْحَمْدُ لِلَّهِ', translation: 'All praise is for Allah.', transliteration: 'Alhamdulillah', repeat: 33, reference: 'Bukhari & Muslim' },
  { id: 'sl5', categoryId: 'sleep', arabic: 'اللَّهُ أَكْبَرُ', translation: 'Allah is the Greatest.', transliteration: 'Allahu Akbar', repeat: 34, reference: 'Bukhari & Muslim' },

  // Upon Waking
  { id: 'w1', categoryId: 'wakeup', arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', translation: 'All praise is for Allah who gave us life after having taken it from us and unto Him is the resurrection.', transliteration: 'Alhamdu lillahil-ladhi ahyana ba\'da ma amatana wa ilayhin-nushur', repeat: 1, reference: 'Bukhari' },
  { id: 'w2', categoryId: 'wakeup', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', translation: 'None has the right to be worshipped except Allah alone, He has no partner, His is the dominion and His is the praise, and He is able to do all things.', transliteration: 'La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa ala kulli shayin qadir', repeat: 1, reference: 'Bukhari' },
  { id: 'w3', categoryId: 'wakeup', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', translation: 'Glory is to Allah and praise is to Him.', transliteration: 'SubhanAllahi wa bihamdihi', repeat: 3, reference: 'Muslim' },
  { id: 'w4', categoryId: 'wakeup', arabic: 'رَبِّ اغْفِرْ لِي', translation: 'My Lord, forgive me.', transliteration: 'Rabbighfir li', repeat: 3, reference: 'Abu Dawud' },

  // Travel
  { id: 't1', categoryId: 'travel', arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ', translation: 'Glory to Him who has subjected this to us, and we could never have it by our efforts alone.', transliteration: 'Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin', repeat: 1, reference: 'Muslim' },
  { id: 't2', categoryId: 'travel', arabic: 'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَٰذَا الْبِرَّ وَالتَّقْوَىٰ', translation: 'O Allah, we ask You on this our journey for goodness and piety.', transliteration: 'Allahumma inna nas\'aluka fi safarina hadhal-birra wat-taqwa', repeat: 1, reference: 'Muslim' },
  { id: 't3', categoryId: 'travel', arabic: 'اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَٰذَا وَاطْوِ عَنَّا بُعْدَهُ', translation: 'O Allah, make this journey easy for us and make its distance easy.', transliteration: 'Allahumma hawwin alayna safarana hadha watwi anna bu\'dah', repeat: 1, reference: 'Muslim' },
  { id: 't4', categoryId: 'travel', arabic: 'اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ وَالْخَلِيفَةُ فِي الْأَهْلِ', translation: 'O Allah, You are the companion on the journey and the caretaker of the family.', transliteration: 'Allahumma antas-sahibu fis-safari wal-khalifatu fil-ahl', repeat: 1, reference: 'Muslim' },

  // Food & Drink
  { id: 'f1', categoryId: 'food', arabic: 'بِسْمِ اللَّهِ', translation: 'In the name of Allah.', transliteration: 'Bismillah', repeat: 1, reference: 'Abu Dawud & Tirmidhi' },
  { id: 'f2', categoryId: 'food', arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ', translation: 'All praise is for Allah who fed us and gave us drink and made us Muslims.', transliteration: 'Alhamdulillahil-ladhi at\'amana wa saqana wa ja\'alana Muslimin', repeat: 1, reference: 'Abu Dawud & Tirmidhi' },
  { id: 'f3', categoryId: 'food', arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِيهِ وَأَطْعِمْنَا خَيْرًا مِنْهُ', translation: 'O Allah, bless it for us and feed us better than it.', transliteration: 'Allahumma barik lana fihi wa at\'imna khayran minhu', repeat: 1, reference: 'Tirmidhi' },
  { id: 'f4', categoryId: 'food', arabic: 'الْحَمْدُ لِلَّهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ', translation: 'All praise is for Allah, abundant, good and blessed praise.', transliteration: 'Alhamdulillahi hamdan kathiran tayyiban mubarakan fih', repeat: 1, reference: 'Bukhari' },

  // Protection
  { id: 'p1', categoryId: 'protection', arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', translation: 'I seek refuge in the perfect words of Allah from the evil of what He has created.', transliteration: 'A\'udhu bikalimatillahit-tammati min sharri ma khalaq', repeat: 3, reference: 'Muslim' },
  { id: 'p2', categoryId: 'protection', arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ', translation: 'In the name of Allah with whose name nothing is harmed on earth nor in the heavens.', transliteration: 'Bismillahil-ladhi la yadurru ma\'asmihi shay\'un fil-ardi wa la fis-sama\'', repeat: 3, reference: 'Abu Dawud & Tirmidhi' },
  { id: 'p3', categoryId: 'protection', arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', translation: 'I seek refuge in Allah from Satan the accursed.', transliteration: 'A\'udhu billahi minash-Shaytanir-rajim', repeat: 1, reference: 'Bukhari & Muslim' },
  { id: 'p4', categoryId: 'protection', arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ', translation: 'O Allah, I seek refuge in You from anxiety and sorrow.', transliteration: 'Allahumma inni a\'udhu bika minal-hammi wal-hazan', repeat: 1, reference: 'Bukhari' },
  { id: 'p5', categoryId: 'protection', arabic: 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', translation: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.', transliteration: 'La ilaha illa anta subhanaka inni kuntu minaz-zalimin', repeat: 3, reference: 'Tirmidhi' },

  // Fasting (Ramadan)
  { id: 'r1', categoryId: 'ramadan', arabic: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ', translation: 'The thirst is gone, the veins are moistened, and the reward is confirmed, if Allah wills.', transliteration: 'Dhahabaz-zama\'u wabtallatil-\'uruqu, wa thabatal-ajru in sha\'a Allah', repeat: 1, reference: 'Abu Dawud' },
  { id: 'r2', categoryId: 'ramadan', arabic: 'اللَّهُمَّ أَطْعِمْ مَنْ أَطْعَمَنِي وَاسْقِ مَنْ سَقَانِي', translation: 'O Allah, feed him who fed me, and give him drink who gave me drink.', transliteration: 'Allahumma at\'im man at\'amani wasqi man saqani', repeat: 1, reference: 'Muslim' },
  { id: 'r3', categoryId: 'ramadan', arabic: 'اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْيُمْنِ وَالْإِيمَانِ، وَالسَّلَامَةِ وَالْإِسْلَامِ، رَبِّي وَرَبُّكَ اللَّهُ', translation: 'O Allah, let this moon appear on us with security and faith; with safety and Islam. Your Lord and my Lord is Allah.', transliteration: 'Allahumma ahillahu alayna bil-yumni wal-iman, was-salamati wal-Islam, Rabbi wa Rabbuk-Allah', repeat: 1, reference: 'Tirmidhi' },
  
  // Hajj & Umrah
  { id: 'h1', categoryId: 'hajj', arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ', translation: 'Here I am, O Allah, here I am. Here I am, You have no partner, here I am.', transliteration: 'Labbayk Allahumma labbayk, labbayk la sharika laka labbayk', repeat: 1, reference: 'Bukhari & Muslim' },
  { id: 'h2', categoryId: 'hajj', arabic: 'اللَّهُ أَكْبَرُ', translation: 'Allah is the Greatest. (To be said at the Black Stone)', transliteration: 'Allahu Akbar', repeat: 1, reference: 'Bukhari' },
  { id: 'h3', categoryId: 'hajj', arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', translation: 'Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire.', transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan waqina adhaban-nar', repeat: 1, reference: 'Abu Dawud' },
  { id: 'h4', categoryId: 'hajj', arabic: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ', translation: 'Indeed, as-Safa and al-Marwah are among the symbols of Allah.', transliteration: 'Innas-Safa wal-Marwata min sha\'a\'irillah', repeat: 1, reference: 'Muslim' },

  // Family & Home
  { id: 'fam1', categoryId: 'family', arabic: 'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا', translation: 'In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we depend.', transliteration: 'Bismillahi walajna, wa bismillahi kharajna, wa \'ala Rabbina tawakkalna', repeat: 1, reference: 'Abu Dawud' },
  { id: 'fam2', categoryId: 'family', arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', translation: 'In the name of Allah, I trust in Allah; there is no might and no power but in Allah. (When leaving the home)', transliteration: 'Bismillahi tawakkaltu alAllah, la hawla wa la quwwata illa billah', repeat: 1, reference: 'Abu Dawud' },
  { id: 'fam3', categoryId: 'family', arabic: 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', translation: 'My Lord, have mercy upon them [my parents] as they brought me up [when I was] small.', transliteration: 'Rabbirhamhuma kama rabbayani saghira', repeat: 1, reference: 'Quran 17:24' },
  
  // Rain & Weather
  { id: 'nat1', categoryId: 'nature', arabic: 'اللَّهُمَّ صَيِّبًا نَافِعًا', translation: 'O Allah, (bring) beneficial rain clouds.', transliteration: 'Allahumma sayyiban nafi\'an', repeat: 1, reference: 'Bukhari' },
  { id: 'nat2', categoryId: 'nature', arabic: 'سُبْحَانَ الَّذِي يُسَبِّحُ الرَّعْدُ بِحَمْدِهِ وَالْمَلَائِكَةُ مِنْ خِيفَتِهِ', translation: 'Glory is to Him Whom thunder and angels extol from fear of Him.', transliteration: 'Subhanal-ladhi yusabbihur-ra\'du bihamdihi wal-mala\'ikatu min khifatih', repeat: 1, reference: 'Muwatta Malik' },
];
