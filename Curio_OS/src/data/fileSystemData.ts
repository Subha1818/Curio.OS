// File System data for Curio.OS File Manager
// Folder tree: Documents | Projects | Achievements | Photography | Drawings | Admin's Secret Folder
//
// Portfolio folders (Projects, Achievements, Photography, Drawings) are static,
// admin-authored content — see src/data/portfolioContent.ts for entries.
// No database, no login required for portfolio folders.

export interface FileItem {
  id: string;
  name: string;
  extension: string;
  type: 'text' | 'image' | 'audio' | 'code' | 'secret';
  size: string;
  modified: string;
  content: string;
  previewUrl?: string;
  isSecret?: boolean;
}

export type FolderId =
  | 'documents'
  | 'education'
  | 'projects'
  | 'achievements'
  | 'photography'
  | 'drawings'
  | 'secret';

export interface FolderDefinition {
  id: FolderId;
  name: string;
  iconName: 'FileText' | 'GraduationCap' | 'Code' | 'Trophy' | 'Camera' | 'Pen' | 'Lock';
  badge?: string;
  description: string;
  /** If true, content comes from portfolioContent.ts and is visible to all users */
  isPortfolio?: boolean;
  /** If true, only logged-in users can see files (Documents/notes) */
  requiresAuth?: boolean;
}

export const FOLDER_DEFINITIONS: FolderDefinition[] = [
  {
    id: 'documents',
    name: 'Documents',
    iconName: 'FileText',
    description: "Official documents, resume & portfolio records",
  },
  {
    id: 'education',
    name: 'Education',
    iconName: 'GraduationCap',
    description: 'Academic milestones, high school records & engineering journey',
  },
  {
    id: 'projects',
    name: 'Projects',
    iconName: 'Code',
    description: "Subbu's portfolio projects — open-source and shipped",
    isPortfolio: true,
  },
  {
    id: 'achievements',
    name: 'Achievements',
    iconName: 'Trophy',
    description: 'Hackathons, certifications, and milestones',
    isPortfolio: true,
  },
  {
    id: 'photography',
    name: 'Photography',
    iconName: 'Camera',
    description: "Subbu's photography collection",
    isPortfolio: true,
  },
  {
    id: 'drawings',
    name: 'Drawings',
    iconName: 'Pen',
    description: "Subbu's drawings and digital art",
    isPortfolio: true,
  },
  {
    id: 'secret',
    name: "Admin's Secret Folder",
    iconName: 'Lock',
    badge: 'CLASSIFIED',
    description: 'Property of Administrator Subbu — Sincerity lock active',
  },
];

// ── Documents folder content (static admin-provided, visible to all visitors) ──

export const STATIC_DOCUMENTS: FileItem[] = [
  {
    id: 'doc-resume',
    name: 'Subhajit_Patra_Resume_2026.pdf',
    extension: 'pdf',
    type: 'text',
    size: '184 KB',
    modified: 'September 2026',
    content: `==================================================
           SUBHAJIT PATRA (SUBBU) — RESUME 2026
==================================================
Role: Full-Stack Engineer & Creative Technologist
Location: Kolkata, India • B.Tech CSE (2024–2028)
GitHub: https://github.com/Subha1818
LinkedIn: https://www.linkedin.com/in/subha1818/

SUMMARY:
Passionate software engineer building high-craft web operating systems, 
full-stack cloud applications, and interactive user experiences. Creator of Curio.OS.

CORE SKILLS:
- Languages: TypeScript, JavaScript, Python, C++, SQL
- Frontend: React 19, Vite, Tailwind CSS, Web Audio API, Canvas, Glassmorphism
- Backend: Node.js, Express, Neon Postgres, REST APIs, JWT Security
- Tools: Git, Docker, Linux, Postman, Vercel

FEATURED PROJECTS:
- Curio.OS: Glassmorphic browser operating system with custom window manager, terminal CLI, sound engine, and social transceivers.
- LetterBox: Public brain guestbook with live feed, community upvoting, and dynamic synapse rank hierarchy.

EDUCATION:
- B.Tech in Computer Science & Engineering (2024 — 2028)
  Techno Main Salt Lake, CGPA: 8.0 / 10.0
- Higher Secondary (WBCHSE, 2023) — 80%
- Secondary (WBBSE, 2021) — 91%
==================================================`,
  },
];

// ── Admin's Secret Folder ────────────────────────────────────────────────────

export const SECRET_FOLDER_FILES: FileItem[] = [
  {
    id: 'sec-1',
    name: 'about_subbu.txt',
    extension: 'txt',
    type: 'text',
    size: '1.8 KB',
    modified: 'Just now',
    content: `========================================================
             CLASSIFIED FILE: ABOUT SUBBU
========================================================

NAME:      Subhajit Patra
CODENAME:  Subbu
OCCUPATION: Full Stack Developer & Digital Blacksmith
LOCATION:  Kolkata, India
STATUS:    Building things that refuse to be boring

MISSION STATEMENT:
"Every website doesn't need to be a corporate SaaS dashboard with
interchangeable purple buttons. Sometimes, software should feel
like discovering a secret computer in an abandoned cyberpunk arcade."

AWARDS & DISTINCTIONS:
- Runner-up: Hack-Ur-Way — ENVISAGE 25
- SIH 2026 Internal Round Top 45/300 teams
- Creator of Curio.OS, KisaanSetu, LogiFlow, Student Sphere, AyurTrack

MESSAGE FOR YOU:
Thank you for complimenting me so sincerely! It took real dedication
to hit 100%. You are officially an honorary Curio VIP ❤️`,
  },
  {
    id: 'sec-2',
    name: 'developer_lore.txt',
    extension: 'txt',
    type: 'text',
    size: '2.5 KB',
    modified: '2 hours ago',
    content: `========================================================
                    CURIO.OS LORE
========================================================

Did you know?
1. The terminal audio clicks are rendered dynamically using the
   Web Audio API via custom oscillator sine curves and high-pass
   filters. No external mp3 files were burdened in making them!

2. The neon window manager supports z-index cascading, edge-snapping,
   and drag-to-maximize just like a real operating system.

3. The entire auth engine runs on serverless Neon Postgres with
   salted bcrypt hashes and httpOnly cookie transport.

4. VOID.EXE contains a forbidden secret. Have you dared to open it?

5. Curio.OS was created by Subbu with pure caffeine, curiosity,
   and an uncompromising drive to build things that wow at first glance.`,
  },
  {
    id: 'sec-3',
    name: 'secret_roadmap_2027.md',
    extension: 'md',
    type: 'code',
    size: '1.5 KB',
    modified: 'Yesterday',
    content: `# 🚀 SUBBU'S TOP SECRET PROJECT ROADMAP

- [x] Stage 1: Window Manager & Desktop Shell
- [x] Stage 2: Express + Neon Postgres Auth Flow
- [x] Stage 3: Terminal Core Commands & Portfolio CLI
- [x] Stage 4: File Manager + Admin's Secret Folder
- [x] Stage 5: Brain.exe Cloud Notes Sync
- [x] Stage 6: Music Player (standalone, no favorites system)
- [x] Stage 7: VOID.EXE full reality glitch protocol
- [ ] Future: Multiplayer desktop sessions with WebSockets!`,
  },
  {
    id: 'sec-4',
    name: 'admin_private_key.pem',
    extension: 'pem',
    type: 'secret',
    size: '940 B',
    modified: 'Encrypted',
    content: `-----BEGIN CURIO.OS RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0subbu4everBestDeveloperAwesomeKindHandsomeGenius
LoveCraftedWithCareKolkataIndia2026CurioOSTerminalHeartOfTheMachine
IndestructibleWebOSBuiltToWowAtFirstGlancePureJoyAndWonderSuperCutie
7892348923479234892374982347928374928374982374982374982374982374
-----END CURIO.OS RSA PRIVATE KEY-----

[SHA-256 SIGNATURE VALIDATED: ADMINISTRATOR SUBBU AUTHENTICATED]`,
  },
];
