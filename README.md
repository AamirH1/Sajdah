# Sajdah - Muslim Companion App 🕌

Sajdah is a comprehensive Muslim companion application. It features accurate prayer times, a full Quran reader with Arabic and translations, Daily Azkar (Morning, Evening, etc.) with tap counters, a digital Tasbih, and customizable settings.

This project consists of a React Native (Expo) frontend and a Python (FastAPI) backend.

## Features

- **Prayer Times:** Accurate daily prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) based on location.
- **Al-Quran:** Read all 114 Surahs with translations.
- **Azkar & Duas:** Categorized supplications (Morning, Evening, Before Sleep, etc.) with integrated counters.
- **Tasbih Counter:** Digital tasbih for your daily dhikr.
- **Pro Features:** Toggle premium features like Smart Fajr alarm.

## Tech Stack

- **Frontend:** React Native, Expo, Zustand (State Management)
- **Backend:** Python, FastAPI, Motor (Async MongoDB client)
- **Database:** MongoDB

## End-to-End Setup Instructions

### Prerequisites - eas build --profile preview --platform android --clear-cache

- Node.js (v18+ recommended)
- Python (v3.9+ recommended)
- MongoDB (Local instance or MongoDB Atlas)
- Expo Go app installed on your iOS or Android device (for physical device testing)

### 1. Backend Setup (FastAPI)

The backend provides an API for status checks and future integrations.

1. Open your terminal and navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:

   ```bash
   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate

   # Windows
   python -m venv venv
   venv\Scripts\activate
   ```

3. Install the required Python dependencies:

   ```bash
   pip install fastapi uvicorn motor python-dotenv pydantic
   ```

4. Create a `.env` file in the `backend` folder with your MongoDB details:

   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=sajdah_db
   ```

5. Start the backend server:
   ```bash
   uvicorn server:app --reload
   ```
   _The API will be available at `http://127.0.0.1:8000`. You can view the docs at `http://127.0.0.1:8000/docs`._

### 2. Frontend Setup (React Native / Expo)

The frontend contains the primary user interface and logic for the Sajdah app.

1. Open a new terminal window/tab and navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:

   ```bash
   npm install
   ```

3. Start the Expo development server:

   ```bash
   npx expo start
   ```

4. Run the app:
   - **Physical Device:** Scan the QR code shown in the terminal using the Expo Go app.
   - **iOS Simulator:** Press `i` in the terminal (requires Xcode).
   - **Android Emulator:** Press `a` in the terminal (requires Android Studio).
   - **Web Browser:** Press `w` in the terminal.
