export interface DocumentTextEntry {
  id: string;
  filename: string;
  content: string;
  size?: string;
  modified?: string;
}

export const documentsContent: DocumentTextEntry[] = [
  {
    id: 'about-subbu',
    filename: 'about_subbu.txt',
    content: `==================================================
                 WHO IS SUBBU?
==================================================
Hey there, explorer! 👋

I'm Subhajit Patra (most folks call me Subbu).
I'm a full-stack developer, UI tinkerer, and creative technologist from Kolkata, India.

A few quick facts about me:
• I write code that looks good, feels snappy, and doesn't take itself too seriously.
• My natural habitat is a dark terminal window with lofi music playing at 1:30 AM.
• I believe operating systems should have personality, spring physics, and desktop pets.
• When I'm not debugging or tweaking keyframes, I'm sketching anime figures or hunting down bugs (and stray cats).

Want to say hi? Drop a friendly thought into LetterBox or ping me on GitHub / LinkedIn! 🌸`,
    size: '1.2 KB',
    modified: 'September 2026',
  },
  {
    id: 'currently-building',
    filename: 'currently_building.txt',
    content: `==================================================
              CURRENTLY BUILDING & LEARNING
==================================================
Current status: In the zone ⚡

What's actively on my terminal screen right now:
1. Curio.OS Enhancements:
   - Desktop companion AI & whimsical widgets
   - Interactive guestbook mechanics for LetterBox
   - Custom shader-inspired canvas backgrounds & audio synthesis

2. Deepening Knowledge:
   - Full-stack scalable architecture & cloud distributed systems
   - Modern React 19 concurrent patterns & state engines
   - Advanced Data Structures, Algorithms & Competitive Programming

3. Side Quests:
   - Exploring Generative AI agents & local tool-calling workflows
   - Designing retro-futuristic digital art collections

Got ideas or wanna collaborate? Subbu's inbox is always open! 🚀`,
    size: '1.4 KB',
    modified: 'September 2026',
  },
  {
    id: 'developer-manifesto',
    filename: 'developer_manifesto.txt',
    content: `==================================================
             SUBBU'S DEVELOPER MANIFESTO
==================================================
1. Personality > Blandness
   The web has enough lifeless grey dashboards. Software is art; let it breathe, bounce, and have character.

2. Micro-interactions are not optional
   A 200ms spring bounce, a gentle chime on click, and an intuitive hover state turn a boring website into a memorable experience.

3. Keep it lightweight & responsive
   Visual flair should never compromise performance. 60fps animations, zero memory leaks, and accessible components always come first.

4. Stay curious, build relentlessly
   The best way to understand an operating system, a protocol, or a framework is to build one yourself from scratch.

5. Code with kindness
   Be generous with compliments, write clean documentation, and leave the codebase happier than you found it. ✨`,
    size: '1.6 KB',
    modified: 'September 2026',
  },
  {
    id: 'things-i-like',
    filename: 'things_i_like.txt',
    content: `==================================================
                  THINGS I LIKE
==================================================
🎧 Sounds & Tunes:
   • Lofi hip-hop beats to study/relax to
   • Synthwave, retrowave & 80s neon synth lines
   • Japanese city pop & anime soundtracks

💻 Technologies & Craft:
   • TypeScript, React, Tailwind CSS, Node.js, Express
   • Canvas particle simulations & Web Audio synthesizers
   • Unix terminal command-line workflows

🎨 Visual Flavors:
   • Glassmorphism with crisp neon borders
   • Pixel art & twilight purple/pink gradients
   • Hand-drawn pencil sketches & manga line art

🍵 Life Fuel:
   • Hot black coffee & iced matcha tea
   • Late-night coding sprees with zero notifications
   • Fluffy cats kneading on mechanical keyboards 🐾`,
    size: '1.3 KB',
    modified: 'September 2026',
  },
];
