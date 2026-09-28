export interface SocialProfile {
  id: string;
  name: string;
  handle: string;
  url: string;
  logo: string;
  accent: string;
}

export const socialsData: SocialProfile[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "@subha1818",
    url: "https://www.linkedin.com/in/subha1818/",
    logo: "/assets/socials/linkedin.svg",
    accent: "#0A66C2"
  },
  {
    id: "github",
    name: "GitHub",
    handle: "@Subha1818",
    url: "https://github.com/Subha1818",
    logo: "/assets/socials/github.svg",
    accent: "#ffffff"
  },
  {
    id: "leetcode",
    name: "LeetCode",
    handle: "@...",
    url: "",
    logo: "/assets/socials/leetcode.svg",
    accent: "#FFA116"
  },
  {
    id: "instagram",
    name: "Instagram",
    handle: "@subha.x_18",
    url: "https://www.instagram.com/subha.x_18?igsh=MTkyaHJoMjQza2ZmMw%3D%3D",
    logo: "/assets/socials/instagram.svg",
    accent: "#E1306C"
  },
  {
    id: "spotify",
    name: "Spotify",
    handle: "@Subha",
    url: "https://open.spotify.com/user/315mrywb4cc23gg7dqcrdeicfumy?si=afcadb194c1041da&nd=1&dlsi=821c33ca69024780",
    logo: "/assets/socials/spotify.svg",
    accent: "#1DB954"
  }
];
