export interface SkillsData {
  languages: string[];
  frameworksAndLibraries: string[];
  backendAndDatabases: string[];
  toolsAndPlatforms: string[];
}

export const skillsData: SkillsData = {
  languages: ["C", "Java", "Python", "JavaScript", "TypeScript", "HTML5", "CSS3"],
  frameworksAndLibraries: ["React", "Vite", "Tailwind CSS", "Chart.js", "Leaflet", "React Router"],
  backendAndDatabases: ["Node.js", "Supabase", "MongoDB", "PostgreSQL", "REST APIs"],
  toolsAndPlatforms: ["Git", "GitHub", "Figma", "Framer", "Canva"],
};

export default skillsData;
