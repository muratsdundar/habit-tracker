# Mentor / Habit Tracker App Architecture Map

This document outlines the core architecture, state management, and file structure of the project for quick AI context ingestion.

## Folder Structure (`src/`)

- **`app/`**: Expo Router root directory containing entry points (`_layout.jsx`, `index.jsx`).
- **`pages/`**: Main screen components (e.g., `HomePage.jsx`, `ProfilePage.jsx`, `HabitSumPage.jsx`, `AuthPage.jsx`).
- **`components/`**: Reusable UI components (e.g., `HabitListItem.jsx`, `ZenGarden.jsx`).
  - **`modals/`**: Modal dialogs for features like adding tasks (`AddModal.jsx`), focus timer (`FocusModal.jsx`), store (`ShopModal.jsx`), and charts (`GraphModal.jsx`, `TimelineModal.jsx`).
- **`contexts/`**: React Context providers.
  - `ThemeContext.js`: Manages light/dark/system themes and color schemes.
  - `LanguageContext.jsx`: Manages English (`en`) and Turkish (`tr`) translations using `translations.js`.
- **`hooks/`**: Custom React hooks.
  - `useAsyncStorage.js`: Reusable hook for persisting and loading state from React Native's `AsyncStorage`.
- **`utils/`**: Helper functions.
  - `habitUtils.js`: Date manipulation, streak calculation.
  - `chartUtils.js`: Mathematical functions for rendering graph curves (Catmull-Rom to Bezier).
  - `levelUtils.js`: Logic for XP calculation and Zen Garden progression.

## Core State Management

- **Storage Method**: `AsyncStorage` via custom `useAsyncStorage` hook.
- **Key States (stored per user)**:
  - `tasks`: Daily tasks.
  - `habits`: Long-term recurring habits.
  - `history`: Completion records mapping item IDs to dates completed.
  - `economy`: XP and Coins for the gamification/Zen system.
- **Data Model**:
  - `Item`: `{ id, name, type (habit/task), emoji, color, createdAt, category, targetTime }`
  - `History`: `{ [itemId]: { [dateString]: true } }`

## Flow & Features

- **Home Screen (`HomePage.jsx`)**: The central hub displaying the calendar, tasks, habits, and the Zen Garden. It handles the core logic for toggling completions and calculating streaks.
- **Zen Garden (`ZenGarden.jsx`)**: A gamified plant that grows based on the user's best habit streak (XP-based progression).
- **Focus Mode (`FocusModal.jsx`)**: A pomodoro-style timer with ambient sounds (`expo-audio`).
- **Shop / Customization (`ShopModal.jsx`)**: Users can spend earned coins on different visual themes and app icons.

*Note: Use this map as a reference to locate functionality instead of searching blindly across the entire codebase.*
