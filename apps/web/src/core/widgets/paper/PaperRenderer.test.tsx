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

  describe('error handling', () => {
    it('should render error widget with proper styling and accessibility', () => {
      const errorData = {
        error: "Widget validation failed",
        widget: "unknown-widget",
        type: "validation-error"
      };
      
      renderWithTheme(
        <PaperRenderer 
          slug="error" 
          data={errorData} 
        />
      );
      
      // Should have alert role
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      // Should display error message
      expect(screen.getByText(/Widget validation failed/)).toBeInTheDocument();
      expect(screen.getByText(/unknown-widget/)).toBeInTheDocument();
      expect(screen.getByText(/validation-error/)).toBeInTheDocument();
      
      // Should have error styling
      const errorBox = screen.getByRole('alert');
      expect(errorBox).toHaveClass('paper-error');
    });

    it('should sanitize error content', () => {
      const maliciousErrorData = {
        error: '<script>alert("xss")</script>',
        widget: '<img src="x" onerror="alert(1)">',
        type: 'malicious'
      };
      
      renderWithTheme(
        <PaperRenderer 
          slug="error" 
          data={maliciousErrorData} 
        />
      );
      
      // Content should be sanitized
      expect(screen.queryByText('<script>')).not.toBeInTheDocument();
      expect(screen.queryByText('<img')).not.toBeInTheDocument();
      
      // But sanitized content should be present
      expect(screen.getByText(/&lt;script&gt;/)).toBeInTheDocument();
    });
  });

  describe('list truncation and performance', () => {
    it('should truncate long objections lists with "more" indicator', () => {
      const longObjectionsList = {
        items: Array.from({ length: 100 }, (_, i) => ({
          type: `Type${i}`,
          quote: `Quote ${i}`,
          ts: `00:${String(i % 60).padStart(2, '0')}:00`
        }))
      };
      
      renderWithTheme(
        <PaperRenderer 
          slug="objections" 
          data={longObjectionsList} 
        />
      );
      
      // Should show count of all items
      expect(screen.getByText('Objections (100):')).toBeInTheDocument();
      
      // Should only render first 50 items
      expect(screen.getAllByRole('listitem')).toHaveLength(51); // 50 items + 1 "more" indicator
      
      // Should show "more" indicator
      expect(screen.getByText('+50 more objections...')).toBeInTheDocument();
    });

    it('should truncate action items and key moments similarly', () => {
      const longActionItems = {
        items: Array.from({ length: 75 }, (_, i) => ({
          text: `Action ${i}`,
          owner: i % 3 === 0 ? `Owner${i}` : undefined
        }))
      };
      
      renderWithTheme(
        <PaperRenderer 
          slug="actionItems" 
          data={longActionItems} 
        />
      );
      
      expect(screen.getByText('Action Items (75):')).toBeInTheDocument();
      expect(screen.getByText('+25 more action items...')).toBeInTheDocument();
    });

    it('should not show truncation for small lists', () => {
      const smallList = {
        items: Array.from({ length: 10 }, (_, i) => ({
          type: `Type${i}`,
          quote: `Quote ${i}`,
          ts: `00:${String(i).padStart(2, '0')}:00`
        }))
      };
      
      renderWithTheme(
        <PaperRenderer 
          slug="objections" 
          data={smallList} 
        />
      );
      
      expect(screen.getAllByRole('listitem')).toHaveLength(10);
      expect(screen.queryByText(/more objections/)).not.toBeInTheDocument();
    });
  });

  describe('sanitization integration', () => {
    it('should sanitize all text content in objections', () => {
      const maliciousObjections = {
        items: [
          { 
            type: '<script>alert("xss")</script>', 
            quote: '"><img src="x" onerror="alert(1)">', 
            ts: "00:05:30" 
          }
        ]
      };
      
      renderWithTheme(
        <PaperRenderer 
          slug="objections" 
          data={maliciousObjections} 
        />
      );
      
      // Should not contain unescaped HTML
      expect(screen.queryByText('<script>')).not.toBeInTheDocument();
      expect(screen.queryByText('<img')).not.toBeInTheDocument();
      expect(screen.queryByText('onerror')).not.toBeInTheDocument();
    });

    it('should sanitize entity names', () => {
      const maliciousEntities = {
        entities: {
          prospect: ['<script>Acme</script>'],
          people: ['<b>John</b> Doe'],
          products: ['Pro<iframe>Plan</iframe>']
        }
      };
      
      renderWithTheme(
        <PaperRenderer 
          slug="entities" 
          data={maliciousEntities} 
        />
      );
      
      // Should escape HTML in entity names
      expect(screen.queryByText('<script>')).not.toBeInTheDocument();
      expect(screen.queryByText('<iframe>')).not.toBeInTheDocument();
      expect(screen.queryByText('<b>')).not.toBeInTheDocument();
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

    it('should handle circular references safely', () => {
      const data: any = { a: 1 };
      data.self = data; // Create circular reference
      
      renderWithTheme(
        <PaperRenderer 
          slug="unknown-widget" 
          data={data} 
        />
      );
      
      const jsonElement = screen.getByRole('code');
      expect(jsonElement.textContent).toBe('{"a": 1, "self": "[Circular]"}');
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

  describe('print compatibility', () => {
    it('should have paper-widget class for print styling', () => {
      renderWithTheme(
        <PaperRenderer 
          slug="summary" 
          data={{ text: "test" }} 
        />
      );
      
      const paperElement = screen.getByRole('article').closest('.paper-widget');
      expect(paperElement).toBeInTheDocument();
    });
  });
});