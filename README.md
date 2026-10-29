# ⚡ REFLEX REACTOR — Premium Reaction Speed Game
> **Built for IKARUS — KG Reddy College of Engineering & Technology Website-Building Competition**

**Reflex Reactor** is a premium, futuristic esports-grade browser reaction time game. Built from scratch with semantic HTML5, modern responsive CSS3, and high-performance vanilla JavaScript (ES6+), running entirely client-side with zero external frameworks, paid APIs, or dependencies.

---

## 🎮 Live Game Overview

- **Core Gameplay**: 9 reactor core panels arranged in a 3×3 grid. One panel illuminates at a time with a neon pulse. Strike the illuminated coordinate before decay to earn points, compound streak multipliers, and measure your synaptic response latency down to the millisecond.
- **Microsecond Precision**: Utilizes `window.performance.now()` hardware-timestamping to measure reaction times with microsecond-level accuracy.
- **Adaptive Overclocking**: Targets spawn progressively faster as your score increases without exceeding humanly possible limits.
- **Esports Aesthetics**: Dark navy/cyber black palette (`#060913`), electric purple (`#a855f7`), neon cyan (`#00f5ff`), glassmorphism cards, ambient cyber grid background canvas, and dynamic spark particle bursts.
- **Embedded Web Audio Synthesizer**: Zero audio file downloads or 404 risks. Custom multi-oscillator sound synthesis for hits, streaks, errors, countdowns, and game over.
- **AI Auto-Pilot Demonstration Mode**: Includes an autonomous bot that plays the game with realistic esports latency (~180ms), ideal for live competition demonstrations to judges.

---

## 🕹️ Controls & Hotkeys

| Action | Mouse / Touch | Keyboard |
| :--- | :--- | :--- |
| **Strike Panels 1–9** | Tap / Click Panel | Numeric Keys `1` to `9` (Top row & Numpad) |
| **Start / Replay** | Click Button | <kbd>Space</kbd> or <kbd>Enter</kbd> |
| **AI Auto-Pilot Demo** | Click "🤖 AI AUTO-PILOT" | <kbd>D</kbd> |
| **Pause / Resume** | Click Pause / Resume | <kbd>Escape</kbd> |
| **Mute / Unmute** | Toggle Audio Button in Navbar | Top Nav Action |

---

## 🏆 Scoring & Game Rules

1. **Target Hit**: `+10` base points × Active Streak Multiplier.
2. **Streak Multipliers**:
   - `0 – 4` hits: **1.0x** (Standard)
   - `5 – 9` hits: **1.5x** (Overclocked)
   - `10 – 14` hits: **2.0x** (Hyper Drive)
   - `15+` hits: **2.5x** (Maximum Singularity)
3. **Miss Penalties**:
   - Clicking an inactive panel = `+1 Miss` & streak resets to 0.
   - Letting an active target decay/expire = `+1 Miss` & streak resets to 0.
4. **Resolved Guard**: Each target can be scored only once. Subsequent or accidental spam clicks on resolved targets are safely ignored.
5. **Accuracy Metric**: `(Hits / (Hits + Misses)) × 100%`. Displays `0%` if no attempts were made.
6. **Reaction Telemetry**: Fastest reaction latency and average latency computed exclusively from valid hits in milliseconds. Displays `--` if 0 hits occur.

---

## ⚡ Difficulty Modes

- **Easy (Recruit)**: 1250ms target response window, 350ms spawn interval, 800ms minimum window cap.
- **Medium (Cyber Pilot)**: 900ms response window, 250ms spawn interval, 550ms minimum window cap.
- **Hard (Hyper Reflex)**: 650ms response window, 180ms spawn interval, 380ms minimum window cap.

---

## 📂 Project Architecture

```
neural nexus/
├── index.html        # Semantic HTML5 structure & esports HUD layout
├── style.css         # Cyberpunk/esports styling, glassmorphism, responsive grid & animations
├── script.js         # Game state machine, Web Audio synth, canvas particles, storage, AI bot
└── README.md         # Documentation, run guide & deployment instructions
```

---

## 🚀 How to Run Locally

Because Reflex Reactor is built entirely with client-side web standards, **no build step, npm install, or local server is required**:

1. **Direct File Open**:
   - Double-click `index.html` or drag it into any modern web browser (Chrome, Edge, Firefox, Safari).
2. **VS Code Live Server**:
   - Open the project folder in VS Code, right-click `index.html`, and select **"Open with Live Server"**.
3. **PowerShell / Python (Optional)**:
   - Run `python -m http.server 8000` and visit `http://localhost:8000`.

---

## 🌐 How to Deploy for Competition Demonstration

Reflex Reactor can be deployed in under 60 seconds to any static hosting platform:

### Method 1: GitHub Pages
1. Push the files (`index.html`, `style.css`, `script.js`) to a GitHub repository.
2. Go to **Repository Settings** > **Pages**.
3. Set the Branch to `main` (or `master`) and folder to `/ (root)`.
4. Click **Save** — your live link is generated automatically!

### Method 2: Netlify Drop / Vercel
1. Drag and drop the project folder directly onto [app.netlify.com/drop](https://app.netlify.com/drop).
2. Instantly receive an SSL-secured live competition URL.

---

## 📋 Features Checklist (IKARUS Competition Ready)

- [x] Real playable game engine with 3 explicit states (`START`, `ACTIVE PLAY`, `RESULTS`).
- [x] Hardware-accurate millisecond timer using `window.performance.now()`.
- [x] Exactly one active target at a time with guaranteed cooldown and clean resolution.
- [x] Working streak multiplier system (1.0x, 1.5x, 2.0x, 2.5x) with milestone audio chimes.
- [x] Web Audio API synth engine (zero external assets, 0ms latency, safe autoplay compliance).
- [x] Autonomous AI Auto-Pilot demonstration mode (<kbd>D</kbd>).
- [x] Interactive particle sparks and cyber grid ambient canvas.
- [x] Full keyboard mapping (1–9 keys, Space, Enter, Escape, D).
- [x] Touch-optimized responsive layout for smartphones, tablets, laptops, and ultra-wide displays.
- [x] Persistent browser storage (`localStorage`) with Personal Best tracking and safe fallback.
- [x] "Copy Stats Card" feature to share formatted results with competition judges.
- [x] Respects accessibility standards and `prefers-reduced-motion`.
- [x] Dedicated IKARUS — KG Reddy College branding and esports benchmark guide.

