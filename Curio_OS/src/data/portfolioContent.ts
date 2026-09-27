// Portfolio content authored by Subbu — displayed in File Manager
// Drop images into Curio_OS/public/assets/<category>/ and reference them here.
// All content is static — no database, no login required to view.

export interface PortfolioProject {
  id: string;
  title: string;
  banner: string; // path relative to /assets/projects/ — e.g. "kisaansetu.jpg"
  thumbnail?: string;
  description: string;
  liveUrl?: string;
  githubUrl?: string;
  techStack: string[];
}

export interface PortfolioAchievement {
  id: string;
  title: string;
  image: string; // path relative to /assets/achievements/
  thumbnail?: string;
  description: string; // one-line
}

export interface PortfolioPhoto {
  id: string;
  image: string; // path relative to /assets/photography/
  thumbnail?: string;
  caption?: string;
}

export interface PortfolioDrawing {
  id: string;
  image: string; // path relative to /assets/drawings/
  thumbnail?: string;
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
      banner: '/assets/projects/kisaansetu.png',
      thumbnail: '/assets/projects/thumbs/kisaansetu.jpg',
      description:
        'Smart procurement queue management system for farmers. Eliminates long waits at procurement centers by digitising the queue using real-time slot booking and SMS notifications.',
      githubUrl: 'https://github.com/Subha1818',
      techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Twilio SMS'],
    },
    {
      id: 'logiflow',
      title: 'LogiFlow',
      banner: '/assets/projects/logiflow.png',
      thumbnail: '/assets/projects/thumbs/logiflow.jpg',
      description:
        'Route optimization and logistics visualizer. Computes shortest delivery paths using graph algorithms and renders them on an interactive map dashboard.',
      githubUrl: 'https://github.com/Subha1818',
      techStack: ['React', 'D3.js', 'Dijkstra', 'Node.js', 'PostgreSQL'],
    },
    {
      id: 'studentsphere',
      title: 'Student Sphere',
      banner: '/assets/projects/studentsphere.png',
      thumbnail: '/assets/projects/thumbs/studentsphere.jpg',
      description:
        'Centralized student resource & peer learning platform — notes sharing, timetable management, campus announcements, and academic collaboration in one place.',
      githubUrl: 'https://github.com/Subha1818',
      techStack: ['React', 'Firebase', 'Tailwind CSS', 'Node.js'],
    },
    {
      id: 'ayursutra',
      title: 'AyurSutra',
      banner: '/assets/projects/ayursutra.png',
      thumbnail: '/assets/projects/thumbs/ayursutra.jpg',
      description:
        'Holistic Panchakarma healing & Ayurvedic clinic management platform — tracks traditional therapies, practitioner schedules, and patient recovery journeys.',
      githubUrl: 'https://github.com/Subha1818',
      techStack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    },
    {
      id: 'parnacare',
      title: 'Parnacare',
      banner: '/assets/projects/parnacare.png',
      thumbnail: '/assets/projects/thumbs/parnacare.jpg',
      description:
        'Ayurvedic wellness dashboard and personalized herbal remedies directory connecting users with qualified traditional health consultants.',
      githubUrl: 'https://github.com/Subha1818',
      techStack: ['React', 'Node.js', 'Express', 'MongoDB'],
    },
    {
      id: 'smart-rannaghor',
      title: 'Smart Rannaghor',
      banner: '/assets/projects/smart-rannaghor.png',
      thumbnail: '/assets/projects/thumbs/smart-rannaghor.jpg',
      description:
        'AI-driven kitchen inventory tracker and recipe recommender — smart pantry management and waste reduction tailored for everyday cooking.',
      githubUrl: 'https://github.com/Subha1818',
      techStack: ['React', 'Python', 'FastAPI', 'Machine Learning'],
    },
    {
      id: 'curio-os',
      title: 'Curio.OS / DREAM.OS',
      banner: '/assets/projects/dreamos.svg',
      thumbnail: '/assets/projects/dreamos.svg',
      description:
        'The fantasy operating system you are currently navigating. Complete with draggable windows, custom terminal, background music player with mini controller, and portfolio showcase.',
      githubUrl: 'https://github.com/Subha1818/Curio.OS',
      techStack: ['React 19', 'TypeScript', 'Vite', 'Express', 'Neon Postgres', 'Web Audio API'],
    },
  ],

  achievements: [
    {
      id: 'sih2025',
      title: 'Smart India Hackathon 2025',
      image: '/assets/achievements/sih2026.png',
      thumbnail: '/assets/achievements/thumbs/sih2026.jpg',
      description: 'Internal Hackathon Qualifier Certificate — Ministry of Education & AICTE.',
    },
    {
      id: 'innovathon2025',
      title: 'Innov-A-Thon (Safalya 2025)',
      image: '/assets/achievements/innovathon.png',
      thumbnail: '/assets/achievements/thumbs/innovathon.jpg',
      description: 'Certificate of Excellence & Participation in Innov-A-Thon.',
    },
    {
      id: 'educathon2024',
      title: 'Educ-A-Thon 2024',
      image: '/assets/achievements/educathon.png',
      thumbnail: '/assets/achievements/thumbs/educathon.jpg',
      description: 'Certificate of Appreciation for Prelims round participation.',
    },
    {
      id: 'ibm-python',
      title: 'IBM — Python for Data Science and AI',
      image: '/assets/achievements/ibm-python.png',
      thumbnail: '/assets/achievements/thumbs/ibm-python.jpg',
      description: 'Professional Coursera Certificate verified by IBM.',
    },
    {
      id: 'devops-bootcamp',
      title: 'DevOps Bootcamp — Zero to Hero',
      image: '/assets/achievements/devops.png',
      thumbnail: '/assets/achievements/thumbs/devops.jpg',
      description: 'Udemy Certificate for CI/CD, Docker, Kubernetes & Cloud infrastructure.',
    },
    {
      id: 'genai-zero-hero',
      title: 'Python & Generative AI Mastery',
      image: '/assets/achievements/genai.png',
      thumbnail: '/assets/achievements/thumbs/genai.jpg',
      description: 'Udemy Certificate for LLMs, prompt engineering, and Gen AI development.',
    },
  ],

  photography: [
    { id: 'photo-01', image: '/assets/photography/photo-01.jpg', thumbnail: '/assets/photography/thumbs/photo-01.jpg', caption: 'Atmospheric Moments — Frame 01' },
    { id: 'photo-02', image: '/assets/photography/photo-02.jpg', thumbnail: '/assets/photography/thumbs/photo-02.jpg', caption: 'Golden Hour Reflections — Frame 02' },
    { id: 'photo-03', image: '/assets/photography/photo-03.jpg', thumbnail: '/assets/photography/thumbs/photo-03.jpg', caption: 'Urban Solitude — Frame 03' },
    { id: 'photo-04', image: '/assets/photography/photo-04.jpg', thumbnail: '/assets/photography/thumbs/photo-04.jpg', caption: 'Moody Horizons — Frame 04' },
    { id: 'photo-05', image: '/assets/photography/photo-05.jpg', thumbnail: '/assets/photography/thumbs/photo-05.jpg', caption: 'Chiaroscuro Studies — Frame 05' },
    { id: 'photo-06', image: '/assets/photography/photo-06.jpg', thumbnail: '/assets/photography/thumbs/photo-06.jpg', caption: 'Nature Through the Lens — Frame 06' },
    { id: 'photo-07', image: '/assets/photography/photo-07.jpg', thumbnail: '/assets/photography/thumbs/photo-07.jpg', caption: 'Architectural Shadows — Frame 07' },
    { id: 'photo-08', image: '/assets/photography/photo-08.jpg', thumbnail: '/assets/photography/thumbs/photo-08.jpg', caption: 'Candid Street Perspectives — Frame 08' },
    { id: 'photo-09', image: '/assets/photography/photo-09.jpg', thumbnail: '/assets/photography/thumbs/photo-09.jpg', caption: 'Twilight Glow — Frame 09' },
    { id: 'photo-10', image: '/assets/photography/photo-10.jpg', thumbnail: '/assets/photography/thumbs/photo-10.jpg', caption: 'Textures of Life — Frame 10' },
    { id: 'photo-11', image: '/assets/photography/photo-11.jpg', thumbnail: '/assets/photography/thumbs/photo-11.jpg', caption: 'The Silent Wanderer — Frame 11' },
    { id: 'photo-12', image: '/assets/photography/photo-12.jpg', thumbnail: '/assets/photography/thumbs/photo-12.jpg', caption: 'Sun-drenched Paths — Frame 12' },
    { id: 'photo-13', image: '/assets/photography/photo-13.jpg', thumbnail: '/assets/photography/thumbs/photo-13.jpg', caption: 'Ethereal Vignette — Frame 13' },
    { id: 'photo-14', image: '/assets/photography/photo-14.webp', thumbnail: '/assets/photography/thumbs/photo-14.jpg', caption: 'Minimalist Compositions — Frame 14' },
    { id: 'photo-15', image: '/assets/photography/photo-15.jpg', thumbnail: '/assets/photography/thumbs/photo-15.jpg', caption: 'Dusk Over the City — Frame 15' },
    { id: 'photo-16', image: '/assets/photography/photo-16.jpg', thumbnail: '/assets/photography/thumbs/photo-16.jpg', caption: 'Serene Landscapes — Frame 16' },
    { id: 'photo-17', image: '/assets/photography/photo-17.jpg', thumbnail: '/assets/photography/thumbs/photo-17.jpg', caption: 'Geometry of Light — Frame 17' },
    { id: 'photo-18', image: '/assets/photography/photo-18.jpg', thumbnail: '/assets/photography/thumbs/photo-18.jpg', caption: 'Tranquil Waters — Frame 18' },
    { id: 'photo-19', image: '/assets/photography/photo-19.jpg', thumbnail: '/assets/photography/thumbs/photo-19.jpg', caption: 'Fleeting Memories — Frame 19' },
    { id: 'photo-20', image: '/assets/photography/photo-20.jpg', thumbnail: '/assets/photography/thumbs/photo-20.jpg', caption: 'The Final Silhouette — Frame 20' },
  ],

  drawings: [
    { id: 'drawing-01', image: '/assets/drawings/drawing-01.jpg', thumbnail: '/assets/drawings/thumbs/drawing-01.jpg', caption: 'Anime Character Study — Sketch 01' },
    { id: 'drawing-02', image: '/assets/drawings/drawing-02.jpg', thumbnail: '/assets/drawings/thumbs/drawing-02.jpg', caption: 'Dynamic Action Pose — Sketch 02' },
    { id: 'drawing-03', image: '/assets/drawings/drawing-03.jpg', thumbnail: '/assets/drawings/thumbs/drawing-03.jpg', caption: 'Portrait Pencil Rendering — Sketch 03' },
    { id: 'drawing-04', image: '/assets/drawings/drawing-04.jpg', thumbnail: '/assets/drawings/thumbs/drawing-04.jpg', caption: 'Fine Line Ink Illustration — Sketch 04' },
    { id: 'drawing-05', image: '/assets/drawings/drawing-05.jpg', thumbnail: '/assets/drawings/thumbs/drawing-05.jpg', caption: 'Manga Expressions — Sketch 05' },
    { id: 'drawing-06', image: '/assets/drawings/drawing-06.jpg', thumbnail: '/assets/drawings/thumbs/drawing-06.jpg', caption: 'Character Concept Art — Sketch 06' },
    { id: 'drawing-07', image: '/assets/drawings/drawing-07.jpg', thumbnail: '/assets/drawings/thumbs/drawing-07.jpg', caption: 'Intricate Cross-Hatching — Sketch 07' },
    { id: 'drawing-08', image: '/assets/drawings/drawing-08.jpg', thumbnail: '/assets/drawings/thumbs/drawing-08.jpg', caption: 'Monochrome Shading Study — Sketch 08' },
    { id: 'drawing-09', image: '/assets/drawings/drawing-09.jpg', thumbnail: '/assets/drawings/thumbs/drawing-09.jpg', caption: 'Detailed Figure Drawing — Sketch 09' },
    { id: 'drawing-10', image: '/assets/drawings/drawing-10.jpg', thumbnail: '/assets/drawings/thumbs/drawing-10.jpg', caption: 'Expressive Eyes & Profile — Sketch 10' },
    { id: 'drawing-11', image: '/assets/drawings/drawing-11.jpg', thumbnail: '/assets/drawings/thumbs/drawing-11.jpg', caption: 'Classic Hero Stance — Sketch 11' },
    { id: 'drawing-12', image: '/assets/drawings/drawing-12.jpg', thumbnail: '/assets/drawings/thumbs/drawing-12.jpg', caption: 'Tonal Value Practice — Sketch 12' },
    { id: 'drawing-13', image: '/assets/drawings/drawing-13.jpg', thumbnail: '/assets/drawings/thumbs/drawing-13.jpg', caption: 'Contour & Shadow Line — Sketch 13' },
    { id: 'drawing-14', image: '/assets/drawings/drawing-14.jpg', thumbnail: '/assets/drawings/thumbs/drawing-14.jpg', caption: 'Graphite Realism Study — Sketch 14' },
    { id: 'drawing-15', image: '/assets/drawings/drawing-15.jpg', thumbnail: '/assets/drawings/thumbs/drawing-15.jpg', caption: 'Anatomy and Proportions — Sketch 15' },
    { id: 'drawing-16', image: '/assets/drawings/drawing-16.jpg', thumbnail: '/assets/drawings/thumbs/drawing-16.jpg', caption: 'Stylized Inking — Sketch 16' },
    { id: 'drawing-17', image: '/assets/drawings/drawing-17.jpg', thumbnail: '/assets/drawings/thumbs/drawing-17.jpg', caption: 'Dramatic Contrast Sketch — Sketch 17' },
    { id: 'drawing-18', image: '/assets/drawings/drawing-18.jpg', thumbnail: '/assets/drawings/thumbs/drawing-18.jpg', caption: 'Manga Hero Portrait — Sketch 18' },
    { id: 'drawing-19', image: '/assets/drawings/drawing-19.jpg', thumbnail: '/assets/drawings/thumbs/drawing-19.jpg', caption: 'Fine Graphite Detailing — Sketch 19' },
    { id: 'drawing-20', image: '/assets/drawings/drawing-20.jpg', thumbnail: '/assets/drawings/thumbs/drawing-20.jpg', caption: 'Creative Doodles & Forms — Sketch 20' },
    { id: 'drawing-21', image: '/assets/drawings/drawing-21.jpg', thumbnail: '/assets/drawings/thumbs/drawing-21.jpg', caption: 'Masterwork Study — Sketch 21' },
    { id: 'drawing-22', image: '/assets/drawings/drawing-22.jpg', thumbnail: '/assets/drawings/thumbs/drawing-22.jpg', caption: 'Signature Artwork Finale — Sketch 22' },
  ],
};
