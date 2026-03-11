import { useTheme } from '@mui/material';

/**
 * Sentiment color utility that maps sentiment labels to MUI theme colors.
 * This ensures that the Minimal theme (or any theme) can recolor automatically.
 */
export type SentimentLabel = 'pos' | 'positive' | 'neu' | 'neutral' | 'neg' | 'negative';

/**
 * Get the appropriate MUI color for a sentiment label.
 * Returns theme-aware colors so different themes can customize the appearance.
 */
export function getSentimentColor(sentiment: SentimentLabel): 'success' | 'default' | 'error' {
  const normalizedSentiment = sentiment.toLowerCase();
  
  if (normalizedSentiment === 'pos' || normalizedSentiment === 'positive') {
    return 'success';
  } else if (normalizedSentiment === 'neg' || normalizedSentiment === 'negative') {
    return 'error';
  } else {
    return 'default'; // neutral
  }
}

/**
 * Hook version that can access theme tokens directly.
 * Useful for getting actual color values instead of semantic names.
 */
export function useSentimentColor(sentiment: SentimentLabel) {
  const theme = useTheme();
  const colorType = getSentimentColor(sentiment);
  
  switch (colorType) {
    case 'success':
      return theme.palette.success.main;
    case 'error':
      return theme.palette.error.main;
    default:
      return theme.palette.grey[500];
  }
}