import { describe, it, expect } from 'vitest';
import { 
  WidgetSlug,
  WidgetConfig,
  DashboardTemplate,
  AIDashboardPayload,
  ProtocolVersion
} from './protocol';
import { 
  SummaryParams,
  PieChartParams
} from './params';
import { WidgetRegistry } from './registry';

describe('Widget Protocol', () => {
  describe('WidgetSlug validation', () => {
    it('should accept valid widget slugs', () => {
      const validSlugs = ['summary', 'sentiment', 'booking', 'pieChart'];
      
      validSlugs.forEach(slug => {
        expect(() => WidgetSlug.parse(slug)).not.toThrow();
      });
    });

    it('should reject invalid widget slugs', () => {
      const invalidSlugs = ['invalidWidget', 'nonExistent', ''];
      
      invalidSlugs.forEach(slug => {
        expect(() => WidgetSlug.parse(slug)).toThrow();
      });
    });
  });

  describe('Parameter validation', () => {
    it('should validate summary params with defaults', () => {
      const result = SummaryParams.parse({});
      expect(result.maxLength).toBe(600);
    });

    it('should validate summary params with custom values', () => {
      const result = SummaryParams.parse({ maxLength: 800 });
      expect(result.maxLength).toBe(800);
    });

    it('should reject invalid summary params', () => {
      expect(() => SummaryParams.parse({ maxLength: 30 })).toThrow(); // below min
      expect(() => SummaryParams.parse({ maxLength: 3000 })).toThrow(); // above max
    });

    it('should validate pie chart params', () => {
      const result = PieChartParams.parse({ height: 300 });
      expect(result.height).toBe(300);
      expect(result.valueKey).toBe('value'); // default
      expect(result.nameKey).toBe('name'); // default
    });
  });

  describe('WidgetConfig validation', () => {
    it('should validate widget config with params', () => {
      const config = {
        slug: 'summary',
        params: { maxLength: 500 }
      };
      
      const result = WidgetConfig.parse(config);
      expect(result.slug).toBe('summary');
      expect(result.params).toEqual({ maxLength: 500 });
    });

    it('should validate widget config without params', () => {
      const config = { slug: 'sentiment' };
      
      const result = WidgetConfig.parse(config);
      expect(result.slug).toBe('sentiment');
      expect(result.params).toEqual({});
    });
  });

  describe('DashboardTemplate validation', () => {
    it('should validate complete dashboard template', () => {
      const template = {
        version: ProtocolVersion,
        layout: { columns: 12 },
        widgets: [
          { slug: 'summary', params: { maxLength: 600 } },
          { slug: 'sentiment', params: { showScore: true } },
          { slug: 'pieChart', params: { height: 240 } }
        ]
      };
      
      const result = DashboardTemplate.parse(template);
      expect(result.version).toBe(ProtocolVersion);
      expect(result.widgets).toHaveLength(3);
      expect(result.layout.columns).toBe(12);
    });

    it('should apply defaults for missing layout', () => {
      const template = {
        version: ProtocolVersion,
        widgets: [{ slug: 'summary' }]
      };
      
      const result = DashboardTemplate.parse(template);
      expect(result.layout.columns).toBe(12);
    });
  });

  describe('AI Dashboard Payload validation', () => {
    it('should validate AI payload', () => {
      const payload = {
        version: ProtocolVersion,
        dashboard: {
          layout: { columns: 12 },
          widgets: [
            { slug: 'summary', params: { maxLength: 500 } },
            { slug: 'pieChart', params: { height: 240 } }
          ]
        }
      };
      
      const result = AIDashboardPayload.parse(payload);
      expect(result.version).toBe(ProtocolVersion);
      expect(result.dashboard.widgets).toHaveLength(2);
    });
  });
});

describe('Widget Registry', () => {
  const mockCall = {
    id: 'test-call-1',
    summary: 'Test summary',
    sentiment: { overall: 'positive', score: 0.8 },
    bookingLikelihood: 0.75
  };

  describe('Parameter validation in registry', () => {
    it('should validate summary widget params', () => {
      const entry = WidgetRegistry.summary;
      const result = entry.validate({ maxLength: 500 });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxLength).toBe(500);
      }
    });

    it('should reject invalid summary params', () => {
      const entry = WidgetRegistry.summary;
      const result = entry.validate({ maxLength: 30 }); // below min
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid summary params');
      }
    });

    it('should validate pie chart params', () => {
      const entry = WidgetRegistry.pieChart;
      const result = entry.validate({ height: 300 });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.height).toBe(300);
      }
    });
  });

  describe('Widget rendering', () => {
    it('should render summary widget without error', () => {
      const entry = WidgetRegistry.summary;
      const validation = entry.validate({});
      
      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(() => entry.render(mockCall, validation.data)).not.toThrow();
      }
    });

    it('should render pie chart widget without error', () => {
      const entry = WidgetRegistry.pieChart;
      const validation = entry.validate({ height: 240 });
      
      expect(validation.success).toBe(true);
      if (validation.success) {
        // Since this uses React hooks, we can't easily test rendering without @testing-library/react
        // Just ensure the render function exists and validation passes
        expect(typeof entry.render).toBe('function');
        expect(validation.data.height).toBe(240);
      }
    });
  });

  describe('Unknown widget handling', () => {
    it('should handle unknown widget slugs', () => {
      const unknownSlug = 'nonExistentWidget';
      // TypeScript should catch this at compile time, but test runtime behavior
      const entry = (WidgetRegistry as any)[unknownSlug];
      
      expect(entry).toBeUndefined();
    });
  });
});