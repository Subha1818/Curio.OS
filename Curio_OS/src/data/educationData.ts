export interface EducationItem {
  id: string;
  step: string;
  stage: string;
  institution: string;
  [key: string]: string;
}

export const educationData: EducationItem[] = [
  {
    id: "secondary",
    step: "01",
    stage: "SECONDARY",
    institution: "Patharjora R.D. High School",
    board: "WBBSE",
    year: "2021",
    result: "91%"
  },
  {
    id: "higher-secondary",
    step: "02",
    stage: "HIGHER SECONDARY",
    institution: "Patharjora R.D. High School",
    board: "WBCHSE",
    year: "2023",
    result: "80%"
  },
  {
    id: "current",
    step: "03",
    stage: "CURRENT",
    institution: "Techno Main Salt Lake",
    degree: "B.Tech CSE",
    duration: "2024 — 2028",
    cgpa: "8.0",
    status: "IN PROGRESS"
  }
];
