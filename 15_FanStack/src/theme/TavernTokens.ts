export type SportType = 'MLB' | 'NFL' | 'PGA';

export interface TavernTheme {
  sport: SportType;
  primary: string; // Hex color for main glowing accents
  secondary: string; // Hex color for secondary elements
  background: string; // Dark theme base color
  surface: string; // Card/surface background color
  border: string; // Border accent color
  textMain: string;
  textMuted: string;
}

export const TavernTokens: Record<SportType, TavernTheme> = {
  MLB: {
    sport: 'MLB',
    primary: '#38bdf8', // Cyan / Sovereign Blue
    secondary: '#0f172a', // Slate
    background: '#0a0c10',
    surface: 'rgba(0, 0, 0, 0.6)',
    border: 'rgba(56, 189, 248, 0.3)',
    textMain: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.4)',
  },
  NFL: {
    sport: 'NFL',
    primary: '#22c55e', // Gridiron Green
    secondary: '#94a3b8', // Steel Silver
    background: '#0a100c',
    surface: 'rgba(0, 0, 0, 0.6)',
    border: 'rgba(34, 197, 94, 0.3)',
    textMain: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.4)',
  },
  PGA: {
    sport: 'PGA',
    primary: '#10b981', // Masters Green
    secondary: '#eab308', // Premium Gold
    background: '#0a100a',
    surface: 'rgba(0, 0, 0, 0.6)',
    border: 'rgba(234, 179, 8, 0.3)', // Gold border
    textMain: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.4)',
  }
};
