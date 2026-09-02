# Persistent Rules for Habit Tracker Project

## Internationalization (i18n)
- **Mandatory Translation:** Any new UI components, texts, alerts, or features added to this project MUST be integrated with the English-Turkish translation system. 
- **Implementation:** Always add the new translation keys to `src/translations.js` (for both `tr` and `en`) and use the `t()` function from `LanguageContext` in the React components. Never leave hardcoded Turkish or English strings in the UI.

## File Modification Notifications
- **Audible Alerts:** Before modifying any files (which prompts the user with an "Accept All" button in the IDE), ALWAYS run `afplay /System/Library/Sounds/Glass.aiff` via `run_command` to play a notification sound. Do not play the sound for regular chat responses, ONLY before code edits.
