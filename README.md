# 🐰 HabbiT

<div align="center">
  <img src="assets/images/icon.png" alt="HabbiT Logo" width="120" />
  <br />
  <p><strong>A beautifully crafted habit tracking app built with React Native & Expo</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-blue?style=flat-square" />
    <img src="https://img.shields.io/badge/Expo-57.0-black?style=flat-square&logo=expo" />
    <img src="https://img.shields.io/badge/React%20Native-0.86-61DAFB?style=flat-square&logo=react" />
    <img src="https://img.shields.io/badge/Language-EN%20%7C%20TR-green?style=flat-square" />
  </p>
</div>

---

## ✨ Features

### 🏠 Home Screen
- **Daily habit list** with intuitive check-off interactions
- **Streak tracking** with visual fire badges
- **Mini progress charts** per habit (7-day bar chart sparklines)
- **Daily Planner Section** — plan your day in timed blocks linked to your habits
- **Postpone / Flexible Streak Protection** — miss a day without breaking your streak (configurable)

### 📊 Statistics & Analytics
- **Full Stats Modal** — heatmap-style calendar grid, 30/90/365-day completion rates
- **Graph Modal** — interactive line/bar charts for habit performance over time
- **Timeline Modal** — chronological log of all habit completions
- **Habit Summary Page** — deep-dive per-habit analytics with monthly breakdowns

### 🧘 Zen Garden
- A calming visual sandbox that rewards consistent habits
- Complete habits → unlock Zen elements (plants, stones, lanterns, water features)
- **Zen Journey Modal** — view your progression milestones
- **Zen Stats Modal** — detailed breakdown of your Zen collection

### 🎯 Focus Mode
- Full-screen Pomodoro-style focus timer linked to a habit
- Animated progress ring, session counter, and break handling
- Haptic and audio feedback on session completion

### 😊 Mood & Reflections
- Log your mood after completing habits (5-tier emoji scale)
- Write free-form reflections attached to any habit
- **Mood Reflection Modal** — view historical mood data per habit

### 🔔 Smart Notifications
- Per-habit customizable reminder times
- Daily summary notifications
- Quiet hours support

### 👤 Profile & Gamification
- **XP & Leveling system** — earn experience for every completed habit
- **Achievements** — unlock badges for streaks, consistency, and milestones
- **Skill Trees** — unlock habit-specific skills as you progress
- Stats overview: total completions, best streak, current level

### 🌐 Internationalization (i18n)
- Full support for **English** and **Turkish** 🇬🇧 🇹🇷
- Language toggle in profile settings, persisted across sessions

### 🏠 Home Screen Widget
- iOS home screen widget showing today's habit status
- Supports Small and Medium widget sizes

### 🔒 PIN Authentication
- Optional PIN lock for privacy
- Stored securely via AsyncStorage

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) ~57.0 |
| Navigation | [Expo Router](https://expo.github.io/router) (file-based) |
| Animations | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) 4.5 |
| Gestures | [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) |
| Storage | [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) |
| Charts | [react-native-svg](https://github.com/software-mansion/react-native-svg) (custom SVG charts) |
| Fonts | [Outfit](https://fonts.google.com/specimen/Outfit) via @expo-google-fonts |
| Audio | expo-audio |
| Haptics | expo-haptics |
| Widgets | expo-widgets |
| Notifications | expo-notifications |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator / Android Emulator **or** a physical device with [Expo Go](https://expo.dev/go)

### Installation

```bash
# Clone the repository
git clone https://github.com/muratsdundar/habit-tracker.git
cd habit-tracker

# Install dependencies
npm install

# Start the dev server
npx expo start
```

### Running on Device

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Physical device (scan QR with Expo Go)
npx expo start
```

---

## 📁 Project Structure

```
habit-tracker/
├── src/
│   ├── app/                  # Expo Router entry & layout
│   ├── pages/                # Full-screen pages
│   │   ├── HomePage.jsx      # Main habit dashboard
│   │   ├── HabitSumPage.jsx  # Per-habit summary & analytics
│   │   ├── ProfilePage.jsx   # User profile, XP, achievements
│   │   └── AuthPage.jsx      # PIN authentication
│   ├── components/
│   │   ├── modals/           # All modal overlays
│   │   ├── ui/               # Reusable UI primitives
│   │   ├── HabitListItem.jsx
│   │   ├── ZenGarden.jsx
│   │   ├── DailyPlannerSection.jsx
│   │   ├── MiniChart.jsx
│   │   ├── StatsTable.jsx
│   │   └── HomeHeader.jsx
│   ├── contexts/             # React Context providers
│   ├── hooks/                # Custom React hooks (useAsyncStorage, etc.)
│   ├── utils/                # Pure utility functions
│   ├── constants/            # App-wide constants & theme colors
│   ├── config/               # App configuration
│   └── translations.js       # EN/TR translation strings
├── assets/                   # Icons, images, sounds
├── widgets/                  # iOS home screen widget
├── android/                  # Android native project
├── ios/                      # iOS native project
├── app.json                  # Expo config
└── package.json
```

---

## 📸 Screenshots

> Coming soon

---

## 📝 License

MIT © [muratsdundar](https://github.com/muratsdundar)
