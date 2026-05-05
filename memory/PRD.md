# Muslim Companion App - PRD

## Overview
A modern Muslim companion React Native Expo mobile app for the Indian subcontinent featuring prayer times, Quran reader, Azkar collections, Tasbih counters, and Pro/Free entitlement system.

## Architecture
- **Frontend**: React Native (Expo SDK 54) with TypeScript
- **State Management**: Zustand with AsyncStorage persistence
- **Navigation**: Expo Router with bottom tabs (Home, Quran, Azkar, Settings)
- **Prayer Calculation**: Custom solar-based algorithm (no external API)
- **Data**: All stored locally (JSON data files)
- **Auth**: None (local dev toggle for Pro/Free)

## Key Features
1. **Prayer Times** - Solar calculation engine with support for Karachi, MWL, Egyptian, UmmAlQura, Dubai, ISNA methods + Hanafi/Shafi madhhab
2. **Quran Reader** - Arabic text with English/Urdu translations, surah list with search
3. **Azkar & Duas** - 8 categories (Morning, Evening, After Salah, Sleep, Wakeup, Travel, Food, Protection)
4. **Tasbih Counter** - Multiple named counters with targets, increment/reset, persistence
5. **Pro/Free Toggle** - Feature gating for multiple languages, smart Fajr alarm, pro themes

## File Structure
```
frontend/
├── app/
│   ├── _layout.tsx (root layout)
│   ├── (tabs)/
│   │   ├── _layout.tsx (tab layout)
│   │   ├── index.tsx (Home)
│   │   ├── quran.tsx (Surah list)
│   │   ├── azkar.tsx (Categories)
│   │   └── settings.tsx (Settings)
│   ├── quran/[surahId].tsx (Reader)
│   ├── azkar/[categoryId].tsx (Detail)
│   └── tasbih.tsx (Counter)
├── src/
│   ├── theme/index.ts (Design tokens)
│   ├── store/ (Zustand stores)
│   ├── data/ (Local data)
│   ├── services/ (Prayer calc)
│   └── hooks/ (Theme hook)
```

## Design
- Teal/Emerald accent (#059669 light, #10B981 dark)
- Light/Dark mode support
- Islamic-inspired minimal design
- Rounded cards, generous spacing

## Pro Features (gated)
- Multiple Quran translation languages (Hindi, Bangla, Tamil)
- Smart Fajr Alarm
- Pro themes
- Advanced bookmarks
- Custom Azkar collections
