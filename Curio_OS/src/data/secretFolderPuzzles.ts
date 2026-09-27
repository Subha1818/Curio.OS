export interface SecretPuzzle {
  id: string;
  answer: string; // The unscrambled sentence
  popup: {
    emoji: string;
    title: string;
    subtitle: string;
    jab: string;
    buttonText: string;
  };
}

export const SECRET_FOLDER_PUZZLES: SecretPuzzle[] = [
  {
    id: 'dumb',
    answer: 'I think I am dumb',
    popup: {
      emoji: '🎉',
      title: 'CONGRATULATIONS!',
      subtitle: 'You solved the puzzle.',
      jab: 'But... are you really?',
      buttonText: 'OK',
    },
  },
  {
    id: 'smartest-dev',
    answer: 'Subbu is the smartest developer',
    popup: {
      emoji: '✅',
      title: 'Correct!',
      subtitle: 'Your taste in developers is fabulous!',
      jab: 'An undisputed universal truth.',
      buttonText: 'OK',
    },
  },
  {
    id: 'deserve-secrets',
    answer: "I deserve to access Subbu's secrets",
    popup: {
      emoji: '🔓',
      title: 'Correct!',
      subtitle: "That's a very confident statement for someone begging for access.",
      jab: 'Proceed with caution.',
      buttonText: 'OK',
    },
  },
  {
    id: 'handsome-subbu',
    answer: 'I think Subbu is handsome',
    popup: {
      emoji: '❤️',
      title: 'Correct!',
      subtitle: 'Finally, someone with functioning vision.',
      jab: '20/20 eyesight confirmed.',
      buttonText: 'OK',
    },
  },
  {
    id: 'better-code',
    answer: 'Subbu wrote better code than anyone',
    popup: {
      emoji: '👑',
      title: 'Correct!',
      subtitle: 'Modesty was never an option here.',
      jab: 'The compiler wept with joy.',
      buttonText: 'OK',
    },
  },
  {
    id: 'supreme-genius',
    answer: "I apologize for doubting Subbu's supreme genius",
    popup: {
      emoji: '🙏',
      title: 'Correct!',
      subtitle: 'Apology noted, but your credentials remain suspicious.',
      jab: 'Mercy granted for today.',
      buttonText: 'OK',
    },
  },
  {
    id: 'dream-masterpiece',
    answer: 'DREAM OS is an absolute masterpiece',
    popup: {
      emoji: '🌟',
      title: 'Correct!',
      subtitle: "Flattery won't get you everywhere, but it got you past this door.",
      jab: 'Welcome inside.',
      buttonText: 'OK',
    },
  },
  {
    id: 'unworthy-viewer',
    answer: 'I am unworthy to view this folder',
    popup: {
      emoji: '🎭',
      title: 'Correct!',
      subtitle: 'Self-awareness is the first step toward enlightenment.',
      jab: 'Enter with humility.',
      buttonText: 'OK',
    },
  },
];
