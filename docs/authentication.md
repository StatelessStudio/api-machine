# Authentication

api-machine provides a declarative authentication system with cascading support across server, router, and endpoint levels. Authentication schemes automatically integrate with OpenAPI/Swagger documentation.

## Quick Start

```typescript
import { RestServer, BaseApiRouter, BaseApiEndpoint } from 'api-machine';
import { BearerAuthenticationScheme } from 'api-machine';

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

## Authentication Architecture

api-machine supports two main types of authentication schemes:

### Inline Authentication Schemes
Run authentication inline **on every request**. Credentials are extracted and validated immediately:
- Extract credentials from the request (e.g., Bearer tokens from Authorization header)
- Validate credentials synchronously
- Middleware runs for every incoming request
- Examples: `BearerAuthenticationScheme`, API key schemes, JWT validation
- Use for: Stateless authentication (tokens, API keys)

### Session Authentication Schemes
Provide an `AuthFlow` to **obtain a session**, then verify that session **on every request**:
- Define multi-step authentication process using `AuthFlow` (e.g., challenge → authorization → token exchange)
- Session is obtained once through the auth flow
- Session is then validated by checking the session ID on each subsequent request
- Examples: OAuth2, SAML, session-based authentication
- Use for: Stateful authentication flows requiring multiple steps

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
  override authentication = null;
  
  async routes() {
    return [PublicEndpoint];
  }
}

class AdminEndpoint extends BaseApiEndpoint {
  override path = '/admin';
  override authentication = new BearerAuthenticationScheme({
    checkToken: async (token) => token === 'admin-token',
  });
  
  async handle() {
    return { admin: true };
  }
}
```

## Built-in Authentication Schemes

### Bearer Authentication

Validates Bearer tokens from the `Authorization` header on **every request**. Uses `InlineAuthenticationScheme` for synchronous inline token validation.

```typescript
import { BearerAuthenticationScheme } from 'api-machine';

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

**How it works:**
- Middleware runs for every incoming request
- Extracts `Authorization: Bearer <token>` header
- Validates token using `checkToken()` 
- Returns 401 Unauthorized if token missing or invalid
- Sets `request.authenticated = true` on successful validation

**Architecture:**
- Extends `InlineAuthenticationScheme` for stateless credential-based auth
- `getCredentials()` - Extracts Bearer token from Authorization header on each request
- `authenticate()` - Validates extracted token using `checkToken()` on each request

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

## Inline Authentication Schemes

`InlineAuthenticationScheme` runs authentication inline **on every request**. Credentials are extracted from the request and validated immediately, without requiring a separate session object.

**How it works:**
1. Middleware runs for each incoming request
2. `getCredentials(request)` extracts credentials from the request
3. `authenticate({ credentials, request })` validates the credentials
4. If validation succeeds, request continues; otherwise an error is thrown
5. No session is created or stored

**Key Methods:**
- `getCredentials(request)` - Extract credentials from the request
- `authenticate({ credentials, request })` - Validate the extracted credentials

**Use cases:**
- API key validation (fixed key in header)
- JWT token validation (stateless bearer tokens)
- Basic authentication (username/password in header)
- Any credential that can be validated synchronously on each request

```typescript
import { InlineAuthenticationScheme } from 'api-machine';
import { ApiRequest } from 'api-machine';

class ApiKeyScheme extends InlineAuthenticationScheme {
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
  
  getCredentials(request: ApiRequest): unknown {
    const key = request.headers['x-api-key'];
    if (!key) {
      throw new UnauthorizedError('API key is required');
    }
    return key;
  }
  
  async authenticate(options: {
    credentials: string;
    request: ApiRequest;
  }): Promise<void> {
    if (options.credentials !== this.apiKey) {
      throw new UnauthorizedError('Invalid API key');
    }
  }
}
```

## Session Authentication Schemes

`SessionAuthenticationScheme` manages stateful authentication. It provides an `AuthFlow` to **obtain a session**, and then verifies that session **on each request**.

**How it works:**
1. `getAuthFlow()` defines the multi-step authentication process (e.g., challenge → authorization → token exchange)
2. User goes through the auth flow to obtain a session
3. Session ID is stored (typically in cookies or request state)
4. On each subsequent request, middleware calls `checkSession()` to verify the session exists and is valid
5. Only after session is verified, the request continues

**Key Methods:**
- `getAuthFlow()` - Define the authentication flow steps used to obtain a session
- `getMiddleware()` - Middleware that checks the session on each request (inherited)

**Use cases:**
- OAuth2 with authorization code flow
- SAML-based authentication
- Multi-step authentication requiring user interaction
- Session-based systems where session state must be maintained

```typescript
import { SessionAuthenticationScheme, AuthFlow, AuthStep } from 'api-machine';
import { ApiRequest, ApiResponse } from 'api-machine';

class OAuth2Scheme extends SessionAuthenticationScheme {
  getSecurityScheme() {
    return {
      type: 'oauth2' as const,
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://provider.com/oauth/authorize',
          tokenUrl: 'https://provider.com/oauth/token',
          scopes: { 'read:data': 'Read data' },
        },
      },
    };
  }
  
  getAuthFlow(): AuthFlow {
    return {
      challenge: {
        description: 'Generate authorization challenge (PKCE)',
        async handle(request: ApiRequest, response: ApiResponse) {
          const challenge = generateChallenge();
          return { challenge };
        },
      },
      authorization: {
        description: 'User authorizes application at OAuth2 provider',
        async handle(request: ApiRequest, response: ApiResponse) {
          // User is redirected to provider, returns with authorization code
          const code = request.query.code as string;
          return { code };
        },
      },
      tokenExchange: {
        description: 'Exchange authorization code for access token and session',
        async handle(request: ApiRequest, response: ApiResponse) {
          const accessToken = await exchangeCodeForToken(request.body.code);
          const session = await createSession(accessToken);
          return { session };
        },
      },
    };
  }
}
```

**Session Validation Flow:**
After a session is obtained through the auth flow, each request:
1. Extracts the session ID (from cookies, headers, etc.)
2. Calls `checkSession()` to verify the session still exists
3. Validates the session is not expired
4. Sets `request.authenticated = true` and allows request to continue

## AuthFlow & AuthStep

An `AuthFlow` is a named collection of `AuthStep` objects representing the complete multi-step authentication process used to obtain a session. See [src/authentication/auth-flow.ts](../src/authentication/auth-flow.ts) and [src/authentication/auth-step.ts](../src/authentication/auth-step.ts) for type definitions.

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

Create custom authentication by extending `InlineAuthenticationScheme` or `SessionAuthenticationScheme` depending on your needs.

**For credential-based auth** (API keys, tokens):

```typescript
import { InlineAuthenticationScheme } from 'api-machine';
import { ApiRequest } from 'api-machine';

class CustomKeyScheme extends InlineAuthenticationScheme {
  getSecurityScheme() {
    return {
      type: 'apiKey' as const,
      in: 'header' as const,
      name: 'X-Custom-Key',
    };
  }
  
  getCredentials(request: ApiRequest): unknown {
    return request.headers['x-custom-key'];
  }
  
  async authenticate(options: {
    credentials: string;
    request: ApiRequest;
  }): Promise<void> {
    if (!await this.validateKey(options.credentials)) {
      throw new UnauthorizedError('Invalid key');
    }
  }
  
  private async validateKey(key: string): Promise<boolean> {
    // Your validation logic
    return key === 'valid-key';
  }
}
```

**Required Methods:**
- `getSecurityScheme()`: Returns OpenAPI SecuritySchemeObject
- `getMiddleware()`: Returns Express middleware function (inherited)
- `getSecurityRequirement()`: Optional, returns OpenAPI SecurityRequirementObject

## Available Exports

The authentication module exports the following. See [src/authentication/index.ts](../src/authentication/index.ts) for the complete list:

- `AuthenticationScheme` - Base class for all schemes
- `InlineAuthenticationScheme` - For credential-based auth
- `SessionAuthenticationScheme` - For stateful multi-step auth
- `AuthStep` - Interface for auth flow steps
- `AuthFlow` - Type for collections of steps
- `BearerAuthenticationScheme` - Built-in Bearer token scheme
- `AuthenticatedRequest` - Request type with auth flag

## OpenAPI Integration

Authentication schemes automatically generate OpenAPI security definitions:

```typescript
const bearerAuth = new BearerAuthenticationScheme({
  checkToken: async (token) => await validate(token),
  schemeName: 'BearerAuth',
  description: 'JWT Bearer Authentication',
});

const oauth2Auth = new OAuth2Scheme();
// Automatically generates OAuth2 security scheme in OpenAPI spec
```

## Best Practices

1. **Choose the right scheme type:**
   - Use `InlineAuthenticationScheme` for **stateless** auth that happens on every request (API keys, JWT tokens, bearer tokens)
   - Use `SessionAuthenticationScheme` for **stateful** auth with multi-step flows that obtain a session once, then check it on each request (OAuth2, SAML, login forms)

2. **Inline scheme design:**
   - Keep `getCredentials()` focused on extraction only
   - Keep `authenticate()` focused on validation only
   - Runs on every request, so keep it fast

3. **Session scheme design:**
   - Define clear, distinct steps in `AuthFlow` (challenge → authorization → tokenExchange)
   - Session is obtained once, then validated on subsequent requests
   - Use efficient session lookup/validation to minimize request overhead

4. **Use server-level auth as default** - Apply authentication at the server level and override only where needed

5. **Make public routes explicit** - Use `authentication = null` to clearly mark public endpoints

6. **Validate thoroughly:**
   - For inline: validate credentials against secure sources (database, JWT verification)
   - For session: verify session exists and hasn't expired

7. **Use descriptive names** - Help API consumers understand your authentication approach
   - Inline: use scheme names like "BearerAuth", "ApiKeyAuth"
   - Session: use clear auth flow step names (e.g., 'challenge', 'authorization', 'tokenExchange')

8. **Leverage cascading** - Set auth at the appropriate level (server/router/endpoint) based on your needs

## Examples

See [examples/authentication-example.ts](../examples/authentication-example.ts) for a complete working example.
