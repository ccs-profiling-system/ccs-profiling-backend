# Security Middleware Documentation

## Overview

This document describes the security middleware implementation for the CCS Backend System, including rate limiting, CORS configuration, and Helmet security headers.

**Implements Requirements:** 4.2, 25.1

## Components

### 1. Rate Limiting Middleware (`rateLimiter.ts`)

Rate limiting protects the API from abuse by limiting the number of requests from a single IP address.

#### Auth Rate Limiter

- **Purpose**: Protect authentication endpoints from brute force attacks
- **Configuration**:
  - Window: 15 minutes
  - Max requests: 5 per window
  - Applied to: `/api/v1/auth/login`, `/api/v1/auth/refresh`

```typescript
import { authRateLimiter } from '../shared/middleware/rateLimiter';

router.post('/login', authRateLimiter, authController.login);
```

#### API Rate Limiter

- **Purpose**: Protect general API endpoints from excessive requests
- **Configuration**:
  - Window: 1 minute
  - Max requests: 100 per window
  - Applied to: All `/api/*` routes

```typescript
app.use('/api', apiRateLimiter);
```

#### Rate Limit Response

When rate limit is exceeded, the API returns:

```json
{
  "success": false,
  "error": {
    "message": "Too many requests. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Rate Limit Headers

The middleware includes standard rate limit headers:

- `RateLimit-Limit`: Maximum number of requests allowed
- `RateLimit-Remaining`: Number of requests remaining in current window
- `RateLimit-Reset`: Time when the rate limit window resets (Unix timestamp)

### 2. Security Headers Middleware (`security.ts`)

#### Helmet Configuration

Helmet sets secure HTTP headers to protect against common web vulnerabilities.

**Security Headers Applied:**

1. **Content-Security-Policy (CSP)**
   - Restricts resource loading to prevent XSS attacks
   - Default: Only allow resources from same origin

2. **X-Frame-Options**
   - Prevents clickjacking attacks
   - Set to: `DENY` (prevents embedding in iframes)

3. **X-Content-Type-Options**
   - Prevents MIME type sniffing
   - Set to: `nosniff`

4. **Strict-Transport-Security (HSTS)**
   - Forces HTTPS connections
   - Max age: 1 year (31536000 seconds)
   - Includes subdomains

5. **X-XSS-Protection**
   - Enables browser XSS filtering

6. **Referrer-Policy**
   - Controls referrer information
   - Set to: `strict-origin-when-cross-origin`

7. **X-Powered-By**
   - Hidden to prevent information disclosure

#### CORS Configuration

CORS (Cross-Origin Resource Sharing) controls which origins can access the API.

**Configuration:**

```typescript
{
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    // Check against allowed origins from environment
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-API-Version', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 86400 // 24 hours
}
```

**Environment Configuration:**

Set allowed origins in `.env`:

```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

For multiple origins, separate with commas. Use `*` to allow all origins (not recommended for production).

## Usage

### Application Setup

The security middleware is applied globally in `app.ts`:

```typescript
import { helmetConfig, getCorsOptions } from './shared/middleware/security';
import { apiRateLimiter } from './shared/middleware/rateLimiter';

// Security headers
app.use(helmetConfig);

// CORS
app.use(cors(getCorsOptions()));

// Rate limiting for all API routes
app.use('/api', apiRateLimiter);
```

### Route-Specific Rate Limiting

Apply auth rate limiter to specific routes:

```typescript
import { authRateLimiter } from '../../../shared/middleware/rateLimiter';

router.post('/login', authRateLimiter, authController.login);
router.post('/register', authRateLimiter, authController.register);
```

## Testing

### Unit Tests

Tests are located in:
- `rateLimiter.test.ts` - Rate limiting functionality
- `security.test.ts` - Helmet and CORS configuration

Run tests:

```bash
npm test -- rateLimiter.test.ts
npm test -- security.test.ts
```

### Test Coverage

**Rate Limiter Tests:**
- ✅ Allows requests within rate limit
- ✅ Blocks requests exceeding rate limit
- ✅ Includes rate limit headers
- ✅ Auth rate limiter (5 requests per 15 minutes)
- ✅ API rate limiter (100 requests per minute)

**Security Tests:**
- ✅ Sets security headers (Helmet)
- ✅ Hides X-Powered-By header
- ✅ Sets Content-Security-Policy
- ✅ Sets HSTS header
- ✅ Allows requests with no origin
- ✅ Sets CORS headers
- ✅ Handles preflight requests
- ✅ Exposes rate limit headers

## Security Best Practices

### Rate Limiting

1. **Authentication Endpoints**: Always apply strict rate limiting (5-10 requests per 15 minutes)
2. **API Endpoints**: Apply reasonable limits (100-1000 requests per minute)
3. **Monitoring**: Monitor rate limit violations to detect potential attacks
4. **IP-Based**: Rate limits are per IP address by default

### CORS

1. **Allowed Origins**: Only whitelist trusted origins
2. **Credentials**: Only enable credentials for trusted origins
3. **Methods**: Only allow necessary HTTP methods
4. **Headers**: Only expose necessary headers

### Helmet

1. **CSP**: Customize Content-Security-Policy for your application needs
2. **HSTS**: Enable in production with long max-age
3. **Frame Options**: Use DENY unless embedding is required
4. **Regular Updates**: Keep Helmet package updated for latest security patches

## Production Considerations

### Environment Variables

Required environment variables:

```env
# CORS Configuration
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting (optional, uses defaults if not set)
AUTH_RATE_LIMIT_WINDOW=15  # minutes
AUTH_RATE_LIMIT_MAX=5       # attempts
API_RATE_LIMIT_WINDOW=1     # minutes
API_RATE_LIMIT_MAX=100      # requests
```

### Monitoring

Monitor these metrics in production:

1. **Rate Limit Violations**: Track IPs hitting rate limits
2. **CORS Errors**: Monitor blocked cross-origin requests
3. **Security Header Compliance**: Verify headers are set correctly

### Scaling Considerations

For distributed systems:

1. **Shared Rate Limit Store**: Use Redis for rate limiting across multiple servers
2. **Load Balancer**: Configure load balancer to preserve client IP addresses
3. **CDN**: Consider CDN-level rate limiting for additional protection

## Troubleshooting

### Rate Limit Issues

**Problem**: Legitimate users hitting rate limits

**Solutions**:
- Increase rate limit thresholds
- Implement user-based rate limiting (requires authentication)
- Add rate limit bypass for trusted IPs

### CORS Issues

**Problem**: CORS errors in browser console

**Solutions**:
- Verify origin is in CORS_ORIGIN environment variable
- Check for trailing slashes in origin URLs
- Ensure credentials are properly configured

### Security Header Issues

**Problem**: Content blocked by CSP

**Solutions**:
- Review and adjust CSP directives
- Add specific domains to CSP whitelist
- Use nonce or hash for inline scripts

## Related Documentation

- [Error Handling](./errorHandler.ts)
- [Authentication Middleware](./auth.middleware.ts)
- [Validation Middleware](./validator.ts)
- [API Response Format](../utils/apiResponse.ts)

## References

- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
- [Helmet.js](https://helmetjs.github.io/)
- [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
