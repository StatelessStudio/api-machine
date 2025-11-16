# Security Headers

The api-machine server implements security best practices by setting HTTP security headers globally and disabling server fingerprinting headers.

## Default Security Headers

By default, the server applies the following security configurations:

### Headers Set

1. **X-Content-Type-Options: nosniff**
   - Prevents MIME type sniffing attacks
   - Forces browsers to respect the declared Content-Type

2. **X-Frame-Options: DENY**
   - Prevents clickjacking attacks
   - Stops the page from being displayed in iframes

3. **X-XSS-Protection: 1; mode=block**
   - Provides legacy XSS protection for older browsers
   - Modern browsers use Content-Security-Policy instead

### Headers Removed

1. **X-Powered-By**
   - Express's default header is disabled
   - Prevents server fingerprinting and information disclosure
   - Reduces attack surface by not revealing server technology

### Headers Not Set by Default

1. **Strict-Transport-Security (HSTS)**
   - Disabled by default (only use with HTTPS)
   - Can be enabled via configuration when using HTTPS

2. **Content-Security-Policy**
   - Application-specific, should be set per endpoint or route

## Configuration

You can customize security headers when creating your server:

```typescript
import { RestServer } from 'api-machine';

class MyServer extends RestServer {
    override async routes() {
        return [/* your routers */];
    }
}

// Example 1: Default security (recommended)
const server = new MyServer({
    port: 3000
});

// Example 2: Custom security configuration
const server = new MyServer({
    port: 3000,
    securityHeaders: {
        disableXPoweredBy: true,      // Remove X-Powered-By
        noSniff: true,                 // Set X-Content-Type-Options
        frameOptions: 'SAMEORIGIN',    // Allow same-origin iframes
        xssProtection: true,           // Set X-XSS-Protection
        hsts: 31536000,                // Enable HSTS for 1 year (HTTPS only!)
    }
});

// Example 3: Disable security headers (not recommended)
const server = new MyServer({
    port: 3000,
    securityHeaders: {
        disableXPoweredBy: false,
        noSniff: false,
        frameOptions: false,
        xssProtection: false,
        hsts: false,
    }
});
```

## Security Headers Options

### disableXPoweredBy
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Disables the `X-Powered-By` header to prevent server fingerprinting

### noSniff
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Sets `X-Content-Type-Options: nosniff` to prevent MIME type sniffing

### frameOptions
- **Type:** `'DENY' | 'SAMEORIGIN' | false`
- **Default:** `'DENY'`
- **Description:** Controls the `X-Frame-Options` header
  - `'DENY'`: Page cannot be displayed in any iframe
  - `'SAMEORIGIN'`: Page can be displayed in iframes from same origin
  - `false`: Header not set

### xssProtection
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Sets `X-XSS-Protection: 1; mode=block` for legacy browser protection

### hsts
- **Type:** `number | false`
- **Default:** `false`
- **Description:** Sets `Strict-Transport-Security` header with max-age in seconds
  - **Only use with HTTPS!**
  - Common values: `31536000` (1 year), `63072000` (2 years)
  - `false`: Header not set

## Override Headers in Endpoints

You can override global security headers in individual endpoints:

```typescript
import { ApiRequest, ApiResponse, BaseApiEndpoint } from 'api-machine';

export class CustomHeaderEndpoint extends BaseApiEndpoint {
    override path = '/custom';

    async handle(request: ApiRequest, response: ApiResponse) {
        // Override global X-Frame-Options for this endpoint
        response.setHeader('X-Frame-Options', 'SAMEORIGIN');
        
        // Add custom header
        response.setHeader('X-Custom-Header', 'value');
        
        // Override X-Powered-By (if you really need to)
        response.setHeader('X-Powered-By', 'MyCustomServer/1.0');
        
        return { success: true };
    }
}
```

## Best Practices

1. **Keep defaults enabled** - The default security headers provide good baseline protection
2. **Only enable HSTS with HTTPS** - Setting HSTS on HTTP can break your site
3. **Don't re-enable X-Powered-By** - Keeping this disabled improves security
4. **Consider Content-Security-Policy** - Set CSP headers at the application level for modern XSS protection
5. **Test with different browsers** - Security headers can behave differently across browsers

## Additional Security Considerations

While these headers provide important baseline security, remember to also:

- Use HTTPS in production
- Implement proper authentication and authorization
- Validate and sanitize all user input
- Keep dependencies up to date
- Use environment variables for secrets
- Implement rate limiting
- Enable CORS properly for your use case

## References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [Security Headers Website](https://securityheaders.com/)
