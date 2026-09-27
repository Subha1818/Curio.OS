// Portfolio content authored by Subbu — displayed in File Manager
// Drop images into Curio_OS/public/assets/<category>/ and reference them here.
// All content is static — no database, no login required to view.

export interface PortfolioProject {
  id: string;
  title: string;
  banner: string; // path relative to /assets/projects/ — e.g. "kisaansetu.jpg"
  description: string;
  liveUrl?: string;
  githubUrl?: string;
  techStack: string[];
}

export interface PortfolioAchievement {
  id: string;
  title: string;
  image: string; // path relative to /assets/achievements/
  description: string; // one-line
}

export interface PortfolioPhoto {
  id: string;
  image: string; // path relative to /assets/photography/
  caption?: string;
}

export interface PortfolioDrawing {
  id: string;
  image: string; // path relative to /assets/drawings/
  caption?: string;
}

export interface PortfolioContent {
  projects: PortfolioProject[];
  achievements: PortfolioAchievement[];
  photography: PortfolioPhoto[];
  drawings: PortfolioDrawing[];
}

// ── Content (fill in real images and data below) ──────────────────────────────

export const portfolioContent: PortfolioContent = {
  projects: [
    {
      id: 'kisaansetu',
      title: 'KisaanSetu',
      banner: '/assets/projects/kisaansetu.svg',
      description:
        'Smart procurement queue management system for farmers. Eliminates long waits at procurement centers by digitising the queue using real-time slot booking and SMS notifications.',
      githubUrl: 'https://github.com/subhajit',
      techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Twilio SMS'],
    },
    {
      id: 'logiflow',
      title: 'LogiFlow',
      banner: '/assets/projects/logiflow.svg',
      description:
        'Route optimization and logistics visualizer. Computes shortest delivery paths using graph algorithms and renders them on an interactive map dashboard.',
      githubUrl: 'https://github.com/subhajit',
      techStack: ['React', 'D3.js', 'Dijkstra', 'Node.js', 'PostgreSQL'],
    },
    {
      id: 'studentsphere',
      title: 'Student Sphere',
      banner: '/assets/projects/studentsphere.svg',
      description:
        'Centralized student resource platform — notes sharing, timetable management, club announcements, and peer Q&A, all in one place.',
      githubUrl: 'https://github.com/subhajit',
      techStack: ['React', 'Firebase', 'Tailwind CSS'],
    },
    {
      id: 'ayurtrack',
      title: 'AyurTrack',
      banner: '/assets/projects/ayurtrack.svg',
      description:
        'Panchakarma patient management system for Ayurvedic clinics — tracks treatment plans, appointments, and prescriptions with a clean practitioner dashboard.',
      githubUrl: 'https://github.com/subhajit',
      techStack: ['React', 'Node.js', 'MySQL'],
    },
    {
      id: 'dream-os',
      title: 'DREAM.OS / Curio.OS',
      banner: '/assets/projects/dreamos.svg',
      description:
        'The OS you are currently inside. A browser-based fantasy operating system with a real window manager, terminal, music player, file manager, and user authentication backed by Neon Postgres.',
      techStack: ['React 19', 'TypeScript', 'Vite', 'Express', 'Neon Postgres', 'Web Audio API'],
    },
  ],

  achievements: [
    {
      id: 'hackurway',
      title: 'Hack-Ur-Way — ENVISAGE 25',
      image: '/assets/achievements/hackurway.svg',
      description: 'Runner-up at ENVISAGE 2025 inter-college hackathon.',
    },
    {
      id: 'sih2026',
      title: 'Smart India Hackathon 2026',
      image: '/assets/achievements/sih2026.svg',
      description: 'Internal Round — Top 45 out of 300 teams.',
    },
    {
      id: 'ibm-python',
      title: 'IBM Python Certificate',
      image: '/assets/achievements/ibm-python.svg',
      description: 'IBM-certified Python programming course completion.',
    },
    {
      id: 'aws-cloud',
      title: 'AWS Academy — Cloud Foundations',
      image: '/assets/achievements/aws-cloud.svg',
      description: 'AWS Academy Cloud Foundations graduate.',
    },
  ],

  photography: [
    {
      id: 'photo-001',
      image: '/assets/photography/001.svg',
      caption: 'Coming soon — drop your photos in Curio_OS/public/assets/photography/',
    },
  ],

  drawings: [
    {
      id: 'drawing-001',
      image: '/assets/drawings/001.svg',
      caption: 'Coming soon — drop your drawings in Curio_OS/public/assets/drawings/',
    },
  ],
};
