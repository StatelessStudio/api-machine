# Authentication

ts-rest provides a declarative authentication system with cascading support across server, router, and endpoint levels. Authentication schemes automatically integrate with OpenAPI/Swagger documentation.

## Quick Start

```typescript
import { RestServer, BaseApiRouter, BaseApiEndpoint } from 'ts-rest';
import { BearerAuthenticationScheme } from 'ts-rest';

class SecureEndpoint extends BaseApiEndpoint {
  override path = '/data';
  
  async handle(request, response) {
    return { message: 'Secure data' };
  }
}

class ApiRouter extends BaseApiRouter {
  override path = '/api';
  override authentication = new BearerAuthenticationScheme({
    checkToken: async (token: string) => token === 'secret-token',
    schemeName: 'BearerAuth',
  });
  
  async routes() {
    return [SecureEndpoint];
  }
}

const server = new RestServer({
  port: 4000,
  authentication: new BearerAuthenticationScheme({
    checkToken: async (token: string) => token === 'server-token',
  }),
});
```

## Authentication Cascading

Authentication follows a priority hierarchy:

**Endpoint → Router → Server**

- **Endpoint-level** authentication has highest priority
- **Router-level** authentication applies if endpoint doesn't specify
- **Server-level** authentication applies as the default fallback
- Set `authentication = null` to make a route explicitly public

```typescript
class PublicRouter extends BaseApiRouter {
  override path = '/public';
  override authentication = null;  // Bypass server auth
  
  async routes() {
    return [PublicEndpoint];
  }
}

class AdminEndpoint extends BaseApiEndpoint {
  override path = '/admin';
  override authentication = new BearerAuthenticationScheme({
    checkToken: async (token) => token === 'admin-token',
  });  // Override router auth
  
  async handle() {
    return { admin: true };
  }
}
```

## Built-in Authentication Schemes

### Bearer Authentication

Validates Bearer tokens from the `Authorization` header.

```typescript
import { BearerAuthenticationScheme } from 'ts-rest';

const auth = new BearerAuthenticationScheme({
  checkToken: async (token: string) => {
    // Validate token (check database, JWT, etc.)
    return token === 'valid-token';
  },
  schemeName: 'BearerAuth',      // Optional: OpenAPI scheme name
  bearerFormat: 'JWT',            // Optional: Token format
  description: 'JWT Bearer Auth', // Optional: OpenAPI description
});
```

**Features:**
- Automatically validates `Authorization: Bearer <token>` header format
- Returns 401 Unauthorized if token missing or invalid
- Integrates with OpenAPI security schemes
- Sets `request.authenticated = true` on successful validation

## Server-Level Authentication

Apply authentication to all endpoints by default:

```typescript
const server = new RestServer({
  port: 4000,
  authentication: new BearerAuthenticationScheme({
    checkToken: async (token) => await validateToken(token),
  }),
});
```

All endpoints will require authentication unless a router or endpoint overrides it with `authentication = null`.

## Router-Level Authentication

Apply authentication to all endpoints in a router:

```typescript
class SecureRouter extends BaseApiRouter {
  override path = '/secure';
  override authentication = new BearerAuthenticationScheme({
    checkToken: async (token) => token === 'router-token',
  });
  
  async routes() {
    return [Endpoint1, Endpoint2];  // Both require auth
  }
}
```

## Endpoint-Level Authentication

Override parent authentication for specific endpoints:

```typescript
class AdminEndpoint extends BaseApiEndpoint {
  override path = '/admin';
  override authentication = new BearerAuthenticationScheme({
    checkToken: async (token) => token === 'admin-token',
    schemeName: 'AdminAuth',
  });
  
  async handle() {
    return { admin: true };
  }
}
```

## Public Routes

Make routes explicitly public by setting `authentication = null`:

```typescript
class PublicEndpoint extends BaseApiEndpoint {
  override path = '/public';
  override authentication = null;  // No authentication required
  
  async handle() {
    return { public: true };
  }
}
```

This bypasses any parent router or server authentication.

## Custom Authentication Schemes

Create custom authentication by extending `AuthenticationScheme`:

```typescript
import { AuthenticationScheme } from 'ts-rest';
import { RequestHandler } from 'express';

class ApiKeyAuthenticationScheme extends AuthenticationScheme {
  constructor(private apiKey: string) {
    super();
  }
  
  getSecurityScheme() {
    return {
      type: 'apiKey' as const,
      in: 'header' as const,
      name: 'X-API-Key',
    };
  }
  
  getMiddleware(): RequestHandler {
    return async (req, res, next) => {
      const apiKey = req.headers['x-api-key'];
      
      if (apiKey !== this.apiKey) {
        throw new UnauthorizedError('Invalid API key');
      }
      
      next();
    };
  }
}
```

**Required Methods:**
- `getSecurityScheme()`: Returns OpenAPI SecuritySchemeObject
- `getMiddleware()`: Returns Express middleware function
- `getSecurityRequirement()`: Optional, returns OpenAPI SecurityRequirementObject

## OpenAPI Integration

Authentication schemes automatically generate OpenAPI security definitions:

```typescript
const auth = new BearerAuthenticationScheme({
  checkToken: async (token) => await validate(token),
  schemeName: 'BearerAuth',
  description: 'JWT Bearer Authentication',
});
```

## Best Practices

1. **Use server-level auth as default** - Apply authentication at the server level and override only where needed
2. **Make public routes explicit** - Use `authentication = null` to clearly mark public endpoints
3. **Validate tokens properly** - Always validate tokens against a secure source (database, JWT verification, etc.)
4. **Use descriptive scheme names** - Help API consumers understand authentication requirements
5. **Leverage cascading** - Set auth at the appropriate level (server/router/endpoint) based on your needs

## Examples

See [examples/authentication-example.ts](../examples/authentication-example.ts) for a complete working example.
