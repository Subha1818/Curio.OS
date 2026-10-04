// Data configuration for Subbu's interactive portfolio in Curio.OS Terminal
// Edit this file to update profile, skills, projects, timeline, achievements, etc.

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
}

export interface SkillCategory {
  category: string;
  skills: { name: string; bar: string }[];
}

export interface TimelineNode {
  year: string;
  items: string[];
}

export interface AchievementItem {
  icon: string;
  title: string;
  detail: string;
}

export interface SubbuProfile {
  name: string;
  alias: string;
  role: string;
  location: string;
  status: string;
  quote: string;
}

export interface SubbuData {
  profile: SubbuProfile;
  skills: SkillCategory[];
  projects: ProjectItem[];
  timeline: TimelineNode[];
  achievements: AchievementItem[];
  currentMission: {
    title: string;
    philosophy: string[];
    statusProgress: string;
    statusPercent: string;
    nextObjective: string;
  };
  now: {
    statusList: string[];
    lastDetected: string;
  };
  interests: string[];
}

export const subbuData: SubbuData = {
  profile: {
    name: 'Subhajit Patra',
    alias: 'Subbu',
    role: 'Full Stack Developer',
    location: 'Kolkata, India',
    status: 'Building something...',
    quote: '"I turn ideas into interfaces."',
  },

  skills: [
    {
      category: 'FRONTEND',
      skills: [
        { name: 'React', bar: '███████████████████' },
        { name: 'JavaScript', bar: '███████████████████' },
        { name: 'HTML / CSS', bar: '███████████████████' },
        { name: 'Tailwind', bar: '██████████████████' },
        { name: 'GSAP', bar: '██████████████' },
      ],
    },
    {
      category: 'BACKEND',
      skills: [
        { name: 'Node.js', bar: '██████████████' },
        { name: 'Express', bar: '██████████████' },
        { name: 'Postgres', bar: '██████████████' },
      ],
    },
    {
      category: 'TOOLS',
      skills: [
        { name: 'Git', bar: '████████████████' },
        { name: 'Figma', bar: '██████████████' },
        { name: 'Framer', bar: '██████████████' },
        { name: 'Canva', bar: '████████████████' },
      ],
    },
    {
      category: 'LANGUAGES',
      skills: [
        { name: 'C', bar: '██████████████' },
        { name: 'Python', bar: '██████████████' },
        { name: 'Java', bar: '██████████████' },
        { name: 'C++', bar: '██████████████' },
      ],
    },
  ],

  projects: [
    {
      id: '01',
      name: 'KISAANSETU',
      description: 'Smart procurement queue management system for farmers',
    },
    {
      id: '02',
      name: 'LOGIFLOW',
      description: 'Route optimization & logistics visualization',
    },
    {
      id: '03',
      name: 'STUDENT SPHERE',
      description: 'Student resource platform',
    },
    {
      id: '04',
      name: 'AYURTRACK',
      description: 'Panchakarma patient management system',
    },
    {
      id: '05',
      name: 'DREAM.OS',
      description: 'You are currently inside it.',
    },
  ],

  timeline: [
    {
      year: '2026',
      items: ['SIH 2026', 'Hackathon projects', 'LogiFlow', 'DREAM.OS', '???'],
    },
    {
      year: '2025',
      items: ['The origin story...'],
    },
  ],

  achievements: [
    {
      icon: '🏆',
      title: 'Hack-Ur-Way — ENVISAGE 25',
      detail: 'Runner-up',
    },
    {
      icon: '🚀',
      title: 'SIH 2026',
      detail: 'Internal Round — Top 45 / 300 teams',
    },
    {
      icon: '📜',
      title: 'IBM Python',
      detail: 'Certified',
    },
    {
      icon: '📜',
      title: 'AWS Academy',
      detail: 'Cloud Foundations Graduate',
    },
    {
      icon: '📜',
      title: '...',
      detail: 'More milestones loading in background',
    },
  ],

  currentMission: {
    title: 'CURRENT MISSION',
    philosophy: ['Build.', 'Break.', 'Fix.', 'Deploy.', 'Repeat.'],
    statusProgress: '███████████░',
    statusPercent: '87%',
    nextObjective: 'Become dangerously good at building things.',
  },

  now: {
    statusList: [
      'coding',
      'learning',
      'overthinking UI',
      'probably changing the navbar again',
    ],
    lastDetected: '2 minutes ago.',
  },

  interests: [
    'Frontend',
    'Creative UI',
    'Movies',
    'Video editing',
    'Graphics',
    'Photography',
    'Hackathons',
    'Building weird things',
    'Learning random technologies',
  ],
};
