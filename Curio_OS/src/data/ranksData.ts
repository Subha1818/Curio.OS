export interface RankDef {
  threshold: number;
  title: string;
  badge: string;
}

export const RANKS_CONFIG: RankDef[] = [
  { threshold: 100, title: 'Cosmic Mind', badge: '🌌 Cosmic Mind' },
  { threshold: 50, title: 'Big Brain', badge: '🧠 Big Brain' },
  { threshold: 20, title: 'Synapse', badge: '⚡ Synapse' },
  { threshold: 5, title: 'Daydreamer', badge: '💭 Daydreamer' },
  { threshold: 0, title: 'Thought Drifter', badge: '🫧 Thought Drifter' },
];

export function getRankFromLikes(likes: number): { title: string; badge: string; threshold: number } {
  const match = RANKS_CONFIG.find((r) => likes >= r.threshold) || RANKS_CONFIG[RANKS_CONFIG.length - 1];
  return {
    title: match.title,
    badge: match.badge,
    threshold: match.threshold,
  };
}
