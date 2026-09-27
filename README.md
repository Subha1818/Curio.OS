# 🌌 Curio.OS / DREAM.OS

> A fantasy web desktop operating system built with React 19, TypeScript, Tailwind CSS, Express, and Neon Postgres.

![Curio.OS](https://img.shields.io/badge/Curio.OS-v2.0-8b5cf6?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-00e699?style=for-the-badge&logo=postgresql)

---

## ✨ Features

- 🖥️ **Full Window Manager**:
  - Movable, draggable windows with 60–120 FPS direct DOM performance.
  - Multi-window cascading, focus z-index management, minimize, maximize, and multi-edge resizing.
  - Custom wallpaper engine with animated shaders and dynamic canvas themes.
- 🎵 **Curio Music Player**:
  - Vinyl turntable player with real-time waveform equalizer animation.
  - Same-origin audio streaming + static asset delivery.
  - **Background Playback**: Continues playing seamlessly when the window is minimized or closed.
  - **Whimsical Floating Mini-Player**: A movable desktop widget with quick controls (Play/Pause, Prev, Next, Expand) and rotating album art.
  - Developer track import CLI (`npm run add-track` in backend).
- 📂 **Portfolio File Manager**:
  - Browse developer projects, achievements, photography, and drawings.
  - Rich project modals with live demo and GitHub links, tech stack badges, and image lightboxes.
  - Notes-as-files document viewer with personal user cloud sync.
  - Sincerity lock secret folder challenge.
- 💻 **Retro Terminal (`Term.exe`)**:
  - Interactive CLI supporting `neofetch`, `matrix`, `cat`, `ls`, `help`, `subbu -*` portfolio commands, and hidden `void` interactions.
- 🧠 **Brain.exe Notes App**:
  - Pinning, tagging, auto-save, and PostgreSQL cloud persistence.
- 🔐 **Authentication System**:
  - Full JWT auth with secure HTTP-only cookies, password hashing (`bcrypt`), and user profiles backed by Neon Postgres.
- 🕳️ **VOID.EXE Mystery Module**:
  - Scripted psychological escalation easter egg with system jitters, terminal unlock, and containment alerts.

---

## 🏗️ Project Architecture

```
My OS/
├── Curio_OS/             # Frontend React 19 + TypeScript + Vite + Tailwind
│   ├── public/           # Static assets, wallpapers, audio tracks, portfolio banners
│   ├── src/
│   │   ├── components/   # Desktop, Taskbar, Window, MiniMusicPlayer, StartMenu
│   │   │   └── apps/     # Terminal, MusicApp, FilesApp, NotesApp, Settings, Void
│   │   ├── context/      # WindowManager, Music, Auth, Void Contexts
│   │   ├── data/         # Portfolio data, file system data, tracks metadata
│   │   └── utils/        # Web Audio synthesizers, API clients
├── curio-server/         # Backend Node.js + Express + TypeScript
│   ├── src/
│   │   ├── db/           # Neon Postgres pool & migrations
│   │   ├── routes/       # Auth, Notes, Secret, Stats, Users
│   │   └── middleware/   # JWT verification & cookies
│   └── scripts/          # add-track developer CLI script
```

---

## 🚀 Quick Start

### 1. Backend (`curio-server`)
```bash
cd curio-server
npm install

# Configure environment
cp .env.example .env
# Fill in your DATABASE_URL and JWT_SECRET in .env

# Run database migrations
npm run migrate

# Start backend server (http://localhost:4000)
npm run dev
```

### 2. Frontend (`Curio_OS`)
```bash
cd Curio_OS
npm install

# Start Vite dev server (http://localhost:5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📜 License

Created with ❤️ by **Subbu (Subhajit Patra)**. MIT License.
