# ⚡ MicroIntern — AI-Powered Micro-Internship Platform

A React Native (Expo Go) app connecting students with local businesses through AI-powered micro-internships.

---

## 🚀 Step-by-Step Setup Guide

### Prerequisites
Make sure you have these installed:
- **Node.js** (v18 or higher) → https://nodejs.org
- **Expo Go** app on your phone → App Store / Play Store
- A code editor (VS Code recommended)

---

### Step 1 — Install Dependencies

Open a terminal inside the `MicroInternApp` folder and run:

```bash
npm install
```

This installs all required packages including Expo SDK, React Native, and animations.

---

### Step 2 — Start the Development Server

```bash
npx expo start
or 
npx expo start --tunnel
```

You'll see a QR code in the terminal.

---

### Step 3 — Open on Your Phone

1. Open the **Expo Go** app on your phone
2. Scan the QR code from the terminal
3. The app will load on your device!

> **Android**: Use the Expo Go app's built-in QR scanner  
> **iOS**: Use the default Camera app to scan

---

### Step 4 — What You'll See

1. **Native Splash** — Brief OS-level splash screen
2. **Animated Custom Splash** — Full branded intro with:
   - Pulsing rings emanating from the logo
   - Shimmer effect on the gradient logo
   - Staggered entrance animations for name, tagline & pills
   - Typing dots loader
   - Smooth fade-out transition (~3.2 seconds)
3. **Home Screen** — Dashboard with hero banner & quick action cards

---

## 📁 Project Structure

```
MicroInternApp/
├── App.tsx                    ← Entry point, controls splash → home transition
├── app.json                   ← Expo config (splash, icons, bundle IDs)
├── package.json               ← Dependencies
├── tsconfig.json              ← TypeScript config
├── babel.config.js            ← Babel (includes Reanimated plugin)
├── assets/                    ← Place icon.png, splash.png here
└── src/
    ├── theme/
    │   └── index.ts           ← Colors, spacing, radius, shadows
    └── screens/
        ├── SplashScreen.tsx   ← Custom animated splash
        └── HomeScreen.tsx     ← Main home dashboard
```

---

## 🎨 Splash Screen Animations Breakdown

| Animation | Duration | Description |
|-----------|----------|-------------|
| Background fade | 400ms | Dark bg fades in |
| Logo spring pop | 500ms | Scale 0.3 → 1 with spring |
| Pulse rings | ∞ loop | Two concentric rings scale & fade |
| Shimmer | ∞ loop | Light sweep across logo gradient |
| App name slide | 600ms | Slides up from below |
| Feature pills | 400ms | Scale bounce in |
| Loading dots | ∞ loop | Sequential opacity fade |
| Exit fade | 600ms | Whole screen fades to home |

---

## 🔧 Customization

### Change Colors
Edit `src/theme/index.ts` → update `COLORS` object

### Change Animation Timing
Edit `src/screens/SplashScreen.tsx` → adjust `duration` values  
The exit timeout is at the bottom: `setTimeout(..., 3200)` — change `3200` to adjust splash duration in ms.

### Add Real Assets
Replace placeholder files in `assets/`:
- `icon.png` — 1024×1024 app icon
- `splash.png` — 1284×2778 splash image
- `adaptive-icon.png` — 1024×1024 for Android

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo` | Core SDK |
| `expo-splash-screen` | Controls native splash |
| `expo-linear-gradient` | Gradient backgrounds & logo |
| `expo-font` | Custom font loading |
| `react-native-reanimated` | High-performance animations |
| `@expo/vector-icons` | Icon library (for future screens) |

---

## 🗺️ Roadmap (Next Steps)

- [ ] Onboarding flow (Student vs Business selection)
- [ ] Auth screens (Sign Up / Login)
- [ ] AI Matching dashboard
- [ ] Internship listing & detail screens
- [ ] Chat / messaging between students & businesses
- [ ] Profile screens
- [ ] Notifications

---

## 🐛 Troubleshooting

**Metro bundler error?**
```bash
npx expo start --clear
```

**Reanimated plugin error?**
Make sure `babel.config.js` has `plugins: ["react-native-reanimated/plugin"]`

**Expo Go version mismatch?**
Update Expo Go from the App Store / Play Store

---

Built with Harshita and yashwant
