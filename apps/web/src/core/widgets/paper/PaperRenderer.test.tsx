// src/core/widgets/paper/PaperRenderer.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { appTheme } from '../../../design/theme';
import { PaperRenderer } from './PaperRenderer';

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={appTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('PaperRenderer', () => {
  describe('accessibility', () => {
    it('should have proper ARIA roles and labels', () => {
      renderWithTheme(
        <PaperRenderer 
          slug="summary" 
          title="Call Summary" 
          data={{ text: "Test summary" }} 
        />
      );
      
      // Check for article role
      expect(screen.getByRole('article')).toBeInTheDocument();
      
      // Check for heading with proper ID
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByRole('article')).toHaveAttribute('aria-labelledby', 'paper-summary-heading');
    });

    it('should provide accessible text for content', () => {
      renderWithTheme(
        <PaperRenderer 
          slug="sentiment" 
          data={{ label: "positive", score: 0.8 }} 
        />
      );
      
      expect(screen.getByLabelText('Sentiment analysis')).toBeInTheDocument();
    });

    it('should handle list content with proper roles', () => {
      const objectionsData = {
        items: [
          { type: "Price", quote: "Too expensive", ts: "00:05:30" },
          { type: "Timeline", quote: "Need it sooner", ts: "00:10:15" }
        ]
      };
      
      renderWithTheme(
        <PaperRenderer 
          slug="objections" 
          data={objectionsData} 
        />
      );
      
      expect(screen.getByLabelText('Customer objections')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
  });

  describe('specific widget renderers', () => {
    it('should render summary with text', () => {
      renderWithTheme(
        <PaperRenderer 
          slug="summary" 
          data={{ text: "This is a test summary" }} 
        />
      );
      
      expect(screen.getByText('This is a test summary')).toBeInTheDocument();
    });

    it('should render summary with fallback for empty text', () => {
      renderWithTheme(
        <PaperRenderer 
          slug="summary" 
          data={{ text: "" }} 
        />
      );
      
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should render sentiment with label and score', () => {
      renderWithTheme(
        <PaperRenderer 
          slug="sentiment" 
          data={{ label: "positive", score: 0.8 }} 
        />
      );
      
      expect(screen.getByText('Overall: positive | Score: 0.8')).toBeInTheDocument();
    });

    it('should render booking likelihood', () => {
      renderWithTheme(
        <PaperRenderer 
          slug="booking" 
          data={{ value: 75 }} 
        />
      );
      
      expect(screen.getByText('Likelihood: 75%')).toBeInTheDocument();
    });

    it('should render objections list with count', () => {
      const data = {
        items: [
          { type: "Price", quote: "Too expensive", ts: "00:05:30" }
        ]
      };
      
      renderWithTheme(
        <PaperRenderer 
          slug="objections" 
          data={data} 
        />
      );
      
      expect(screen.getByText('Objections (1):')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText((content) => {
        return content.includes('Too expensive');
      })).toBeInTheDocument();
    });

    it('should render empty state for objections', () => {
      renderWithTheme(
        <PaperRenderer 
          slug="objections" 
          data={{ items: [] }} 
        />
      );
      
      expect(screen.getByText('Objections (0):')).toBeInTheDocument();
      expect(screen.getByText('No objections recorded')).toBeInTheDocument();
    });

    it('should render action items with owner and due date', () => {
      const data = {
        items: [
          { owner: "John", text: "Follow up with pricing", due: "2024-01-02" },
          { text: "Send proposal", due: "2024-01-03" }
        ]
      };
      
      renderWithTheme(
        <PaperRenderer 
          slug="actionItems" 
          data={data} 
        />
      );
      
      expect(screen.getByText('Action Items (2):')).toBeInTheDocument();
      expect(screen.getByText(/John:/)).toBeInTheDocument();
      expect(screen.getByText(/Follow up with pricing/)).toBeInTheDocument();
      expect(screen.getByText(/Send proposal/)).toBeInTheDocument();
    });

    it('should render entities with proper formatting', () => {
      const data = {
        entities: {
          prospect: ["Acme Corp"],
          people: ["John Doe", "Jane Smith"],
          products: ["Pro Plan"]
        }
      };
      
      renderWithTheme(
        <PaperRenderer 
          slug="entities" 
          data={data} 
        />
      );
      
      expect(screen.getByText('Prospect:')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('People:')).toBeInTheDocument();
      expect(screen.getByText('John Doe, Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Products:')).toBeInTheDocument();
      expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    });
  });

  describe('deterministic JSON fallback', () => {
    it('should render sorted JSON for unknown widgets', () => {
      const data = { zebra: 'last', alpha: 'first', beta: 123 };
      
      renderWithTheme(
        <PaperRenderer 
          slug="unknown-widget" 
          data={data} 
        />
      );
      
      // Should be sorted by keys: alpha, beta, zebra
      const jsonElement = screen.getByRole('code');
      expect(jsonElement.textContent).toContain('"alpha": "first", "beta": 123, "zebra": "last"');
    });

    it('should handle nested objects deterministically', () => {
      const data = { 
        config: { zebra: 1, alpha: 2 },
        items: [{ z: 3, a: 1 }]
      };
      
      renderWithTheme(
        <PaperRenderer 
          slug="unknown-widget" 
          data={data} 
        />
      );
      
      const jsonElement = screen.getByRole('code');
      const text = jsonElement.textContent || '';
      
      // Keys should be sorted
      expect(text).toContain('"config": {"alpha": 2, "zebra": 1}');
      expect(text).toContain('[{"a": 1, "z": 3}]');
    });

    it('should handle null values correctly', () => {
      renderWithTheme(
        <PaperRenderer 
          slug="unknown-widget" 
          data={null} 
        />
      );
      
      // When data is null, DefaultPaper uses data ?? {} which becomes {}
      expect(screen.getByRole('code')).toHaveTextContent('{}');
    });

    it('should handle empty objects and arrays', () => {
      renderWithTheme(
        <PaperRenderer 
          slug="unknown-widget" 
          data={{ empty: {}, array: [] }} 
        />
      );
      
      const jsonElement = screen.getByRole('code');
      expect(jsonElement.textContent).toContain('"array": [], "empty": {}');
    });
  });

  describe('title and headings', () => {
    it('should use provided title', () => {
      renderWithTheme(
        <PaperRenderer 
          slug="summary" 
          title="Custom Title" 
          data={{ text: "test" }} 
        />
      );
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should fall back to slug when no title provided', () => {
      renderWithTheme(
        <PaperRenderer 
          slug="summary" 
          data={{ text: "test" }} 
        />
      );
      
      expect(screen.getByText('summary')).toBeInTheDocument();
    });
  });
});