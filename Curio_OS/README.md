# 🖥️ Curio.OS — Stage 1 Desktop Shell & Boot Sequence

> **A whimsical, browser-native operating system crafted with passion by Subbu.**

Curio.OS allows users to explore anonymously as a guest explorer, interacting with a nostalgic yet modern desktop environment, dynamic windows, retro terminal, music player, thought pad, and classified Easter eggs.

---

## ✨ Stage 1 Features Built

### 1. Fake Boot / POST Sequence
- **CRT / Retro BIOS diagnostics** with ASCII Curio.OS logo.
- Whimsical diagnostic messages:
  - `Checking hardware whimsy thresholds... 100% NOMINAL`
  - `Scanning for unauthorized seriousness... NONE DETECTED!`
  - `Bootstrapping Cutie Pie subsystem... ENGAGED ❤️`
- **Dynamic progress bar** (0% to 100%) with synthesized Web Audio startup chime.
- **Session persistence**: Boot runs once per session (`sessionStorage`), and can be replayed anytime via **Reboot Curio.OS** in the Start Menu or Settings.
- Quick Skip via `[ESC]`, `[Space]`, or click.

### 2. Desktop Environment
- **Dynamic Canvas Wallpaper**: Particle orbs and celestial connecting constellations responding to themes (*Cosmic Aurora*, *Cyber Noir*, *Dreamy Lavender*, *Synthwave Sunset*, *Matrix Minimal*).
- **Desktop Marquee Selection**: Click and drag on desktop to draw selection box.
- **Desktop Context Menu**: Right-click empty desktop to access quick actions.
- **Desktop Icons**:
  - 💻 `Terminal`
  - 📁 `File Explorer`
  - 🎵 `Music Player`
  - 🧠 `Brain.exe (Notes)`
  - ⚙️ `Settings`
  - 🌌 `VOID.EXE` (Restricted Danger App)

### 3. Window Manager (Core Reusable Primitive)
- **Multi-window capability** with smart cascading positions.
- **Smooth Dragging**: Drag by window header bar with viewport boundary containment.
- **Multi-direction Resizing**: 8 resize handles (corners and edges) respecting minimum constraints.
- **Traffic Light Controls**:
  - ✕ Close
  - − Minimize to Taskbar dock
  - ⤢ Maximize / Restore
  - Double-click header bar to toggle maximize
- **Z-Index Focus Management**: Clicking any window brings it smoothly to front with active glow border.

### 4. Desktop Applications (Stage 1 Shells)
- **Terminal**: Interactive shell with command history, autocomplete, and commands: `help`, `about`, `whoami`, `neofetch`, `clear`, `matrix`, `fortune`, `login`, `void`, `secret`.
- **File Explorer**:
  - Anonymous mode folder hierarchy (Documents, Photos, Music, Downloads).
  - 🔐 **Admin's Secret Folder Easter Egg**: Interactive sincerity compliment filter ("Subbu is the best and kindest developer in the world") with live score calculation, confetti trigger, and unlocked classified files!
- **Music Player**: Rotating vinyl turntable, progress bar, audio synthesis, and track playlist with favorite toggle.
- **Brain.exe (Notes)**: Thought stream with tags, timestamps, pin status, and quick input.
- **Settings**: Wallpaper switcher, Web Audio sound chime toggle, system info, and reboot trigger.
- **VOID.EXE**: Interactive mysterious defiance counter with escalating dialogue (`Why?`, `Seriously?`, `Stop.`, `...`, `Fine.`, `VOID.EXE has noticed you. 🌌`).

### 5. Taskbar & System Tray
- **Start Menu Button**: Toggles Start Menu with guest profile badge (`cutie@guest`), app search, and system actions.
- **Taskbar Dock**: Shows open apps with active/minimized indicator pills.
- **System Tray**:
  - Live clock (HH:MM:SS AM/PM) and date.
  - Wi-Fi and Battery indicators.
  - Web Audio mute/unmute button.
  - Notification Bell with unread badges and slide-out panel.

---

## 🚀 Running the Project

```bash
cd "Curio_OS"
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔮 Primed for Stage 2
- Terminal-driven authentication flow (`login` command)
- Supabase Auth, PostgreSQL schema, and Storage integration
- Persistent user profiles, notes, wallpapers, and favorited songs
