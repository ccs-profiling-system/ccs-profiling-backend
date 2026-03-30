import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeObject,
  sanitizeSqlInput,
  sanitizeFilename,
  escapeHtml,
} from './sanitization';

describe('Sanitization Utilities', () => {
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe(
        'alert("xss")'
      );
      expect(sanitizeString('<div>Hello</div>')).toBe('Hello');
      expect(sanitizeString('<p>Test <b>bold</b></p>')).toBe('Test bold');
    });

    it('should remove null bytes', () => {
      expect(sanitizeString('Hello\0World')).toBe('HelloWorld');
      expect(sanitizeString('\0\0test\0')).toBe('test');
    });

    it('should normalize whitespace', () => {
      expect(sanitizeString('Hello    World')).toBe('Hello World');
      expect(sanitizeString('  Multiple   Spaces  ')).toBe('Multiple Spaces');
      expect(sanitizeString('Line\n\nBreaks')).toBe('Line Breaks');
    });

    it('should trim leading and trailing whitespace', () => {
      expect(sanitizeString('  Hello World  ')).toBe('Hello World');
      expect(sanitizeString('\t\nTest\t\n')).toBe('Test');
    });

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString('   ')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
      expect(sanitizeString(123 as any)).toBe('');
    });

    it('should preserve safe text', () => {
      expect(sanitizeString('Hello World')).toBe('Hello World');
      expect(sanitizeString('Test 123')).toBe('Test 123');
      expect(sanitizeString('Special chars: !@#$%')).toBe('Special chars: !@#$%');
    });
  });

  describe('sanitizeEmail', () => {
    it('should convert email to lowercase', () => {
      expect(sanitizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
      expect(sanitizeEmail('Test@Example.Com')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
      expect(sanitizeEmail('\tuser@example.com\n')).toBe('user@example.com');
    });

    it('should remove angle brackets', () => {
      expect(sanitizeEmail('<user@example.com>')).toBe('user@example.com');
      expect(sanitizeEmail('user<>@example.com')).toBe('user@example.com');
    });

    it('should handle empty strings', () => {
      expect(sanitizeEmail('')).toBe('');
      expect(sanitizeEmail('   ')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeEmail(null as any)).toBe('');
      expect(sanitizeEmail(undefined as any)).toBe('');
    });

    it('should preserve valid email format', () => {
      expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
      expect(sanitizeEmail('test.user+tag@example.co.uk')).toBe(
        'test.user+tag@example.co.uk'
      );
    });
  });

  describe('sanitizePhone', () => {
    it('should remove non-numeric characters except + and -', () => {
      expect(sanitizePhone('+1 (234) 567-8900')).toBe('+1234567-8900');
      expect(sanitizePhone('(555) 123-4567')).toBe('555123-4567');
    });

    it('should preserve + and - characters', () => {
      expect(sanitizePhone('+1-234-567-8900')).toBe('+1-234-567-8900');
      expect(sanitizePhone('+44-20-1234-5678')).toBe('+44-20-1234-5678');
    });

    it('should remove spaces and parentheses', () => {
      expect(sanitizePhone('(123) 456 7890')).toBe('1234567890');
      expect(sanitizePhone('123 456 7890')).toBe('1234567890');
    });

    it('should handle empty strings', () => {
      expect(sanitizePhone('')).toBe('');
      expect(sanitizePhone('   ')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizePhone(null as any)).toBe('');
      expect(sanitizePhone(undefined as any)).toBe('');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow valid HTTP URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
      expect(sanitizeUrl('http://example.com/path')).toBe(
        'http://example.com/path'
      );
    });

    it('should allow valid HTTPS URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(sanitizeUrl('https://example.com/path?query=1')).toBe(
        'https://example.com/path?query=1'
      );
    });

    it('should allow relative URLs', () => {
      expect(sanitizeUrl('/path/to/resource')).toBe('/path/to/resource');
      expect(sanitizeUrl('./relative/path')).toBe('./relative/path');
    });

    it('should block javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeUrl('JavaScript:alert(1)')).toBe('');
      expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
    });

    it('should block data: protocol', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
      expect(sanitizeUrl('DATA:text/html,test')).toBe('');
    });

    it('should block vbscript: protocol', () => {
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
      expect(sanitizeUrl('VBScript:msgbox(1)')).toBe('');
    });

    it('should block file: protocol', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBe('');
      expect(sanitizeUrl('FILE:///etc/passwd')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(sanitizeUrl('  https://example.com  ')).toBe(
        'https://example.com'
      );
    });

    it('should handle empty strings', () => {
      expect(sanitizeUrl('')).toBe('');
      expect(sanitizeUrl('   ')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeUrl(null as any)).toBe('');
      expect(sanitizeUrl(undefined as any)).toBe('');
    });

    it('should block URLs without allowed protocols', () => {
      expect(sanitizeUrl('ftp://example.com')).toBe('');
      expect(sanitizeUrl('example.com')).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string values', () => {
      const input = {
        name: '  John Doe  ',
        bio: '<script>alert("xss")</script>Hello',
        age: 25,
      };

      const result = sanitizeObject(input);

      expect(result).toEqual({
        name: 'John Doe',
        bio: 'alert("xss")Hello',
        age: 25,
      });
    });

    it('should sanitize email fields', () => {
      const input = {
        name: 'John',
        email: '  USER@EXAMPLE.COM  ',
      };

      const result = sanitizeObject(input);

      expect(result).toEqual({
        name: 'John',
        email: 'user@example.com',
      });
    });

    it('should sanitize phone fields', () => {
      const input = {
        name: 'John',
        phone: '+1 (234) 567-8900',
      };

      const result = sanitizeObject(input);

      expect(result).toEqual({
        name: 'John',
        phone: '+1234567-8900',
      });
    });

    it('should sanitize URL fields', () => {
      const input = {
        name: 'John',
        website: '  https://example.com  ',
        publication_url: 'javascript:alert(1)',
      };

      const result = sanitizeObject(input);

      expect(result).toEqual({
        name: 'John',
        website: 'https://example.com',
        publication_url: '',
      });
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '  John  ',
          email: 'USER@EXAMPLE.COM',
        },
        metadata: {
          tags: ['<script>tag1</script>', '  tag2  '],
        },
      };

      const result = sanitizeObject(input);

      expect(result).toEqual({
        user: {
          name: 'John',
          email: 'user@example.com',
        },
        metadata: {
          tags: ['tag1', 'tag2'],
        },
      });
    });

    it('should handle arrays', () => {
      const input = {
        tags: ['  tag1  ', '<b>tag2</b>', 'tag3'],
        numbers: [1, 2, 3],
      };

      const result = sanitizeObject(input);

      expect(result).toEqual({
        tags: ['tag1', 'tag2', 'tag3'],
        numbers: [1, 2, 3],
      });
    });

    it('should preserve null and undefined values', () => {
      const input = {
        name: 'John',
        middleName: null,
        suffix: undefined,
      };

      const result = sanitizeObject(input);

      expect(result).toEqual({
        name: 'John',
        middleName: null,
        suffix: undefined,
      });
    });

    it('should preserve non-string types', () => {
      const input = {
        name: 'John',
        age: 25,
        active: true,
        score: 95.5,
      };

      const result = sanitizeObject(input);

      expect(result).toEqual({
        name: 'John',
        age: 25,
        active: true,
        score: 95.5,
      });
    });

    it('should use custom field options', () => {
      const input = {
        name: 'John',
        contact_email: '  USER@EXAMPLE.COM  ',
        mobile_number: '+1 (234) 567-8900',
      };

      const result = sanitizeObject(input, {
        emailFields: ['contact_email'],
        phoneFields: ['mobile_number'],
      });

      expect(result).toEqual({
        name: 'John',
        contact_email: 'user@example.com',
        mobile_number: '+1234567-8900',
      });
    });
  });

  describe('sanitizeSqlInput', () => {
    it('should remove SQL comment markers', () => {
      expect(sanitizeSqlInput("'; DROP TABLE users; --")).toBe(
        "' DROP TABLE users "
      );
      expect(sanitizeSqlInput('/* comment */ SELECT')).toBe(' comment  SELECT');
    });

    it('should remove semicolons', () => {
      expect(sanitizeSqlInput('SELECT * FROM users;')).toBe(
        'SELECT * FROM users'
      );
      expect(sanitizeSqlInput('DROP TABLE users;')).toBe('DROP TABLE users');
    });

    it('should trim whitespace', () => {
      expect(sanitizeSqlInput('  SELECT * FROM users  ')).toBe(
        'SELECT * FROM users'
      );
    });

    it('should handle empty strings', () => {
      expect(sanitizeSqlInput('')).toBe('');
      expect(sanitizeSqlInput('   ')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeSqlInput(null as any)).toBe('');
      expect(sanitizeSqlInput(undefined as any)).toBe('');
    });

    it('should preserve safe SQL-like text', () => {
      expect(sanitizeSqlInput('user@example.com')).toBe('user@example.com');
      expect(sanitizeSqlInput('John Doe')).toBe('John Doe');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove directory traversal attempts', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('___etc_passwd');
      expect(sanitizeFilename('..\\..\\windows\\system32')).toBe(
        '__windows_system32'
      );
    });

    it('should replace slashes with underscores', () => {
      expect(sanitizeFilename('path/to/file.txt')).toBe('path_to_file.txt');
      expect(sanitizeFilename('path\\to\\file.txt')).toBe('path_to_file.txt');
    });

    it('should remove null bytes', () => {
      expect(sanitizeFilename('file\0name.txt')).toBe('filename.txt');
    });

    it('should replace spaces with underscores', () => {
      expect(sanitizeFilename('my file.txt')).toBe('my_file.txt');
      expect(sanitizeFilename('multiple   spaces.txt')).toBe(
        'multiple_spaces.txt'
      );
    });

    it('should remove special characters', () => {
      expect(sanitizeFilename('file<>:"|?*.txt')).toBe('file.txt');
      expect(sanitizeFilename('file!@#$%^&*().txt')).toBe('file.txt');
    });

    it('should preserve dots, dashes, and underscores', () => {
      expect(sanitizeFilename('my-file_name.v2.txt')).toBe(
        'my-file_name.v2.txt'
      );
    });

    it('should trim whitespace', () => {
      expect(sanitizeFilename('  file.txt  ')).toBe('file.txt');
    });

    it('should handle empty strings', () => {
      expect(sanitizeFilename('')).toBe('');
      expect(sanitizeFilename('   ')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeFilename(null as any)).toBe('');
      expect(sanitizeFilename(undefined as any)).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape angle brackets', () => {
      expect(escapeHtml('<div>content</div>')).toBe(
        '&lt;div&gt;content&lt;&#x2F;div&gt;'
      );
    });

    it('should escape quotes', () => {
      expect(escapeHtml('He said "Hello"')).toBe('He said &quot;Hello&quot;');
      expect(escapeHtml("It's working")).toBe('It&#x27;s working');
    });

    it('should escape forward slashes', () => {
      expect(escapeHtml('</script>')).toBe('&lt;&#x2F;script&gt;');
    });

    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(escapeHtml(null as any)).toBe('');
      expect(escapeHtml(undefined as any)).toBe('');
    });

    it('should preserve safe text', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
      expect(escapeHtml('Test 123')).toBe('Test 123');
    });

    it('should handle multiple special characters', () => {
      expect(escapeHtml('<a href="url">Link & Text</a>')).toBe(
        '&lt;a href=&quot;url&quot;&gt;Link &amp; Text&lt;&#x2F;a&gt;'
      );
    });
  });
});
