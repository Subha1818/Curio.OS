import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/secret/score
// Computes live compliment score for Administrator Subbu
router.post('/score', (req: Request, res: Response) => {
  const { message } = req.body as { message?: string };
  if (!message || typeof message !== 'string') {
    res.status(200).json({ score: 0, unlocked: false, feedback: 'Say something nice to Subbu!' });
    return;
  }

  const text = message.toLowerCase().trim();
  let score = 0;

  // Weighted keywords
  if (text.includes('subbu') || text.includes('subhajit')) score += 25;
  if (text.includes('best') || text.includes('great') || text.includes('awesome')) score += 15;
  if (text.includes('love') || text.includes('marry') || text.includes('crush')) score += 20;
  if (text.includes('kind') || text.includes('good') || text.includes('sweet')) score += 15;
  if (text.includes('handsome') || text.includes('cute') || text.includes('cutie')) score += 15;
  if (text.includes('genius') || text.includes('goat') || text.includes('legend') || text.includes('smart')) score += 15;
  if (text.includes('developer') || text.includes('coder') || text.includes('creator') || text.includes('architect')) score += 10;
  if (text.length > 25) score += 5;

  score = Math.min(100, score);
  const unlocked = score === 100;

  let feedback = 'Needs more sincerity... Subbu is waiting.';
  if (score >= 90 && !unlocked) feedback = 'Almost there! Add a touch more adoration to hit 100%.';
  else if (score >= 60) feedback = 'Subbu is smiling, but the lock requires perfection (100%).';
  else if (score >= 30) feedback = 'Nice start, but is that all the love you have?';
  else if (unlocked) feedback = 'PERFECT HARMONY! 100% Sincerity achieved. Unlocking...';

  res.status(200).json({
    score,
    unlocked,
    feedback,
  });
});

export default router;
