# 📊 Bleeding Pattern Tracker

A lightweight desktop application for monitoring irregular bleeding patterns, specifically designed for users with Nexplanon or other hormonal contraceptives.

![Dark theme with pink accents](https://img.shields.io/badge/theme-dark-pink)
![Electron](https://img.shields.io/badge/Electron-41.0.3-47848F?style=flat&logo=electron)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=flat&logo=sqlite)

## Features

### 💍 Ring Tracking
- **Insert/Remove tracking** - Track your Nexplanon insertion and removal dates
- **3-week cycle countdown** - See how many days until your ring should be removed
- **Ring history** - View all past ring cycles

### 📝 Daily Bleeding Log
- **Intensity scale (0-4)**: None, Spotting, Light, Moderate, Heavy
- **Notes field** - Add observations about symptoms or triggers
- **Any date entry** - Log past or future dates

### 📅 Calendar View
- **Visual pattern recognition** - Color-coded bleeding intensity
- **Ring indicators** - See insertion/removal dates at a glance
- **Quick navigation** - Click any date to log or edit

### 📈 Statistics & Pattern Detection
- Total tracking & bleeding days
- Average intensity
- Longest bleeding streak
- Cycle length analysis
- **Pattern alerts** for:
  - Extended bleeding (>7 day streaks)
  - Irregular cycles
  - Unusually long cycles

## Installation

### Prerequisites
- Node.js 16+
- npm

### Setup
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/period-tracker.git
cd period-tracker

# Install dependencies
npm install

# Run the app
npm start
```

### Build for Distribution
```bash
npm run make
```

## Tech Stack

- **Electron** - Desktop application framework
- **SQLite** (better-sqlite3) - Local database storage
- **Webpack** - Module bundling (via Electron Forge)
- **Vanilla JS** - No frontend framework dependencies

## Data Storage

Your data is stored locally in:
- **macOS**: `~/Library/Application Support/period-tracker/tracker.db`
- **Windows**: `%APPDATA%/period-tracker/tracker.db`
- **Linux**: `~/.config/period-tracker/tracker.db`

The database is **not** included in the git repository to protect your privacy.

## Project Structure

```
period-tracker/
├── src/
│   ├── main.js          # Electron main process
│   ├── preload.js       # Context bridge for IPC
│   ├── renderer.js      # Renderer entry point
│   ├── index.html       # Main UI
│   ├── index.css        # Main styles
│   └── ring-styles.css  # Ring tracking styles
├── database.js          # SQLite setup
├── package.json
├── webpack.main.config.js
├── webpack.renderer.config.js
└── forge.config.js      # Electron Forge config
```

## Usage Tips

### Tracking Your Ring Cycle
1. Insert a new ring → Go to Daily Log, select date, click "Insert Ring"
2. The app shows countdown to 3-week removal
3. Remove ring → Click "Remove Ring"
4. Track bleeding patterns throughout each cycle

### Identifying Patterns
- Use the Calendar view to spot extended bleeding episodes
- Check Statistics for cycle irregularities
- Review Notes for symptom triggers

## Privacy

- All data stays on your device
- No cloud sync or external servers
- Database excluded from git commits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT
