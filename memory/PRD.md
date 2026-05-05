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
- **Notifications**: Expo Notifications for prayer time alerts
- **Location**: Expo Location for GPS + manual city picker (22 cities)

## Key Features
1. **Prayer Times** - Solar calculation engine with support for Karachi, MWL, Egyptian, UmmAlQura, Dubai, ISNA methods + Hanafi/Shafi madhhab
2. **Quran Reader** - All 114 surahs listed, Arabic text with English/Urdu translations for selected surahs (Al-Fatihah, Ya-Sin, Ar-Rahman, Al-Mulk, Ad-Duhaa, Al-Qadr, Al-Asr, Al-Kawthar, Al-Ikhlas, Al-Falaq, An-Nas)
3. **Azkar & Duas** - 8 categories (Morning, Evening, After Salah, Sleep, Wakeup, Travel, Food, Protection) with 45+ dhikr items
4. **Tasbih Counter** - Multiple named counters with targets, increment/reset, persistence
5. **Pro/Free Toggle** - Feature gating for multiple languages, smart Fajr alarm, pro themes
6. **Location Picker** - GPS detection + 22 Indian subcontinent cities (India, Pakistan, Bangladesh, Sri Lanka, Nepal, Saudi Arabia, UAE)
7. **Notification Service** - Schedules local notifications for each prayer, supports Smart Fajr early warning
8. **Onboarding Flow** - 4-step walkthrough introducing features on first launch

## File Structure
```
frontend/
├── app/
│   ├── _layout.tsx (root layout with onboarding check)
│   ├── onboarding.tsx (4-step intro)
│   ├── location.tsx (GPS + city picker)
│   ├── tasbih.tsx (counter)
│   ├── (tabs)/
│   │   ├── _layout.tsx (tab layout)
│   │   ├── index.tsx (Home - prayer times)
│   │   ├── quran.tsx (Surah list)
│   │   ├── azkar.tsx (Categories)
│   │   └── settings.tsx (Settings)
│   ├── quran/[surahId].tsx (Reader)
│   └── azkar/[categoryId].tsx (Detail)
├── src/
│   ├── theme/index.ts (Design tokens)
│   ├── store/ (Zustand stores)
│   ├── data/ (Local data - 114 surahs, 45+ azkar)
│   ├── services/ (Prayer calc, notifications)
│   └── hooks/ (Theme hook)
```

## Design
- Teal/Emerald accent (#059669 light, #10B981 dark)
- Light/Dark mode support
- Islamic-inspired minimal design
- Rounded cards, generous spacing

