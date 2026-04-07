/**
 * Input Sanitization Utilities
 * Provides functions to sanitize user input and prevent injection attacks
 * 
 * Implements Requirements 21.1, 21.2
 */

/**
 * Sanitize a string by removing potentially dangerous characters
 * Prevents XSS and injection attacks
 * 
 * @param input - String to sanitize
 * @returns Sanitized string
 * 
 * @example
 * sanitizeString('<script>alert("xss")</script>') // Returns: 'scriptalert("xss")/script'
 * sanitizeString('Hello World') // Returns: 'Hello World'
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ');
}

/**
 * Sanitize an email address
 * Ensures email format and removes dangerous characters
 * 
 * @param email - Email to sanitize
 * @returns Sanitized email in lowercase
 * 
 * @example
 * sanitizeEmail('  User@Example.COM  ') // Returns: 'user@example.com'
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }

  return email
    .trim()
    .toLowerCase()
    .replace(/[<>]/g, '');
}

/**
 * Sanitize a phone number
 * Removes all non-numeric characters except + and -
 * 
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number
 * 
 * @example
 * sanitizePhone('+1 (234) 567-8900') // Returns: '+1-234-567-8900'
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') {
    return '';
  }

  return phone
    .trim()
    .replace(/[^\d+-]/g, '');
}

/**
 * Sanitize a URL
 * Ensures URL is safe and properly formatted
 * 
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 * 
 * @example
 * sanitizeUrl('https://example.com/path') // Returns: 'https://example.com/path'
 * sanitizeUrl('javascript:alert(1)') // Returns: ''
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmed.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }

  // Only allow http, https, and relative URLs
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./')
  ) {
    return trimmed;
  }

  return '';
}

/**
 * Sanitize an object by applying sanitization to all string values
 * Recursively sanitizes nested objects and arrays
 * 
 * @param obj - Object to sanitize
 * @param options - Sanitization options
 * @returns Sanitized object
 * 
 * @example
 * sanitizeObject({
 *   name: '  John Doe  ',
 *   email: 'JOHN@EXAMPLE.COM',
 *   bio: '<script>alert("xss")</script>Hello'
 * })
 * // Returns: {
 * //   name: 'John Doe',
 * //   email: 'john@example.com',
 * //   bio: 'scriptalert("xss")/scriptHello'
 * // }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    emailFields?: string[];
    phoneFields?: string[];
    urlFields?: string[];
  } = {}
): T {
  const {
    emailFields = ['email'],
    phoneFields = ['phone', 'phone_number', 'mobile'],
    urlFields = ['url', 'website', 'link', 'publication_url'],
  } = options;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      sanitized[key as keyof T] = value;
    } else if (typeof value === 'string') {
      // Apply specific sanitization based on field name
      if (emailFields.includes(key)) {
        sanitized[key as keyof T] = sanitizeEmail(value) as T[keyof T];
      } else if (phoneFields.includes(key)) {
        sanitized[key as keyof T] = sanitizePhone(value) as T[keyof T];
      } else if (urlFields.includes(key)) {
        sanitized[key as keyof T] = sanitizeUrl(value) as T[keyof T];
      } else {
        sanitized[key as keyof T] = sanitizeString(value) as T[keyof T];
      }
    } else if (Array.isArray(value)) {
      // Recursively sanitize arrays
      sanitized[key as keyof T] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            sanitizeObject(item, options)
          : typeof item === 'string'
          ? sanitizeString(item)
          : item
      ) as T[keyof T];
    } else if (typeof value === 'object') {
      // Recursively sanitize nested objects
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
      sanitized[key as keyof T] = sanitizeObject(value, options);
    } else {
      // Keep other types as-is (numbers, booleans, etc.)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      sanitized[key as keyof T] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize SQL-like input to prevent SQL injection
 * Note: This is a defense-in-depth measure. Always use parameterized queries.
 * 
 * @param input - Input to sanitize
 * @returns Sanitized input
 * 
 * @example
 * sanitizeSqlInput("'; DROP TABLE users; --") // Returns: "' DROP TABLE users --"
 */
export function sanitizeSqlInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    // Remove SQL comment markers
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    // Remove semicolons (statement terminators)
    .replace(/;/g, '');
}

/**
 * Sanitize filename to prevent directory traversal attacks
 * 
 * @param filename - Filename to sanitize
 * @returns Safe filename
 * 
 * @example
 * sanitizeFilename('../../../etc/passwd') // Returns: 'etc_passwd'
 * sanitizeFilename('my file.txt') // Returns: 'my_file.txt'
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') {
    return '';
  }

  return filename
    .trim()
    // Remove directory traversal attempts
    .replace(/\.\./g, '')
    .replace(/\//g, '_')
    .replace(/\\/g, '_')
    // Remove null bytes
    .replace(/\0/g, '')
    // Replace spaces with underscores
    .replace(/\s+/g, '_')
    // Remove special characters except dots, dashes, and underscores
    .replace(/[^a-zA-Z0-9._-]/g, '');
}

/**
 * Escape HTML special characters to prevent XSS
 * 
 * @param input - String to escape
 * @returns HTML-escaped string
 * 
 * @example
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}
