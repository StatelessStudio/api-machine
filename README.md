# API-Machine

A lightweight, TypeScript-first REST API framework built on Express with a class-based routing architecture.

## Installation

```bash
npm i api-machine
```

## Features

- **TypeScript-First**: Fully typed API development with TypeScript
- **Self-documenting** - Automatically hosts Swagger & OpenAPI (when enabled)
- **Class-Based Architecture**: Organize your API with classes for servers, routers, and endpoints
- **Built on Express**: Leverages the power and ecosystem of Express.js
- **Secure by Default**: Automatic security headers and server fingerprinting protection
- **CORS Support**: Built-in CORS handling
- **Error Handling**: Automatic error handling with standardized responses
- **Configurable**: Flexible configuration for ports, payload sizes, and logging

## Quick Start

See the [Quick Start Example](examples/quick-start/) for a complete, runnable example.

Here's the basic structure:

### 1. Endpoints

```typescript
class HelloEndpoint extends BaseApiEndpoint {
	override path = '/hello';

	override async handle(request, response) {
		return { message: 'Hello, World!' };
	}
}
```

### 2. Routers

```typescript
class MyRouter extends BaseApiRouter {
	override path = '/api';

	override async routes() {
		return [HelloEndpoint, /* UsersRouter */];
	}
}
```

### 3. Servers

```typescript
class MyApiServer extends RestServer {
	override router = MyRouter;
}

const server = new MyApiServer({
	port: 4000,
	swaggerEnabled: process.env?.NODE_ENV === 'development'
})
```

### Swagger

Navigate to http://localhost:4000/docs to browse your swagger API docs

## Examples

The [`examples/`](examples/) directory contains comprehensive examples:

- **[Quick Start](examples/quick-start/README.md)** - Basic server setup demonstrating the fundamental concepts
  - Simple server, router, and endpoint structure
  - Default GET endpoints
  - Basic JSON responses
  - Minimal configuration

- **[Complete Example](examples/complete-example/README.md)** - Advanced features and production patterns
  - Full CRUD operations (GET, POST, PUT, DELETE)
  - Route parameters and validation
  - Error handling with proper status codes
  - Custom logger configuration (ts-tiny-log)
  - Express integration (headers, query params)
  - Request body validation
  - Structured error responses

### Example with Options

```typescript
const server = new MyApiServer({
  port: 8080,
  maxPayloadSizeMB: 20,
  maxUrlEncodedSizeMB: 2,
  log: myCustomLogger
});
```

#### Using Different HTTP Methods

api-machine provides convenience classes for each HTTP method with appropriate default status codes:

```typescript
// GET endpoint (200 OK by default)
class GetUsersEndpoint extends GetEndpoint {
	override path = '/users';
	
	async handle(request, response) {
		return [{ id: 1, name: 'John' }];
	}
}

// POST endpoint
class CreateUserEndpoint extends PostEndpoint {
	override path = '/users';
	
	async handle(request, response) {
		const newUser = {
			id: Date.now(),
			name: request.body.name
		};

		return newUser;
	}
}

// PUT endpoint
class UpdateUserEndpoint extends PutEndpoint {
	override path = '/users/:id';
	
	async handle(request, response) {
		const id = parseInt(request.params['id'], 10);

		// Update entire user resource
		return { id, ...request.body };
	}
}

// PATCH endpoint
class PatchUserEndpoint extends PatchEndpoint {
	override path = '/users/:id';
	
	async handle(request, response) {
		const id = parseInt(request.params['id'], 10);

		// Update only provided fields
		return { id, ...request.body };
	}
}

// DELETE endpoint (204 No Content by default)
class DeleteUserEndpoint extends DeleteEndpoint {
	override path = '/users/:id';
	
	async handle(request, response) {
		const id = parseInt(request.params['id'], 10);

		// Deletion logic here
		return {};
	}
}
```

#### Pre-Built Endpoints

##### HealthCheckEndpoint

A ready-to-use health check endpoint that returns system status information. Simply include it in your router. For advanced usage, extending the health check with custom checks, and deployment examples (Kubernetes, Docker, monitoring), see the **[Health Check Endpoint Documentation](docs/health-check-endpoint.md)**.

## Error Handling

api-machine provides a comprehensive set of HTTP error classes for standardized error responses. All errors extend `HTTPError` and automatically format responses with proper status codes and headers.

```typescript
import { NotFoundError, BadRequestError, UnauthorizedError } from 'api-machine';

class GetUserEndpoint extends GetEndpoint {
	override path = '/users/:id';
	
	async handle(request, response) {
		const id = parseInt(request.params['id'], 10);
		const user = await findUser(id);
		
		if (!user) {
			throw new NotFoundError('User not found', {
				details: { userId: id }
			});
		}
		
		return user;
	}
}
```

**Key Features:**
- Built-in error classes covering HTTP status codes 400-451
- Automatic JSON error responses with timestamps
- Support for custom headers (e.g., `WWW-Authenticate`, `Retry-After`)
- Optional `details` field for additional context
- User-provided headers override defaults

**Common Error Classes:**
- `BadRequestError` (400)
- `UnauthorizedError` (401) 
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `UnprocessableEntityError` (422)
- `TooManyRequestsError` (429)

For the complete list of error classes, usage examples, and custom error creation, see the **[HTTP Errors Documentation](docs/http-errors.md)**.

## Validation & Sanitization

api-machine supports request validation and sanitization using [valsan](https://www.npmjs.com/package/valsan). You can declare ObjectSanitizer members on your endpoint classes for `body`, `query`, `params`, or `headers`:

```typescript
import { ObjectSanitizer, EmailValidator } from 'valsan';
import { NameValSan } from './examples/complete-example/users/name-valsan';

class CreateUserEndpoint extends PostEndpoint {
  override path = '/users';

  override body = new ObjectSanitizer({
    name: new NameValSan(),
    email: new EmailValidator(),
  });

  async handle(request, response) {
    // request.body is validated & sanitized
    // ...
  }
}
```

- If validation fails, a 400 error is returned with details.
- If validation succeeds, the sanitized values are available in `request.body`, `request.query`, etc.

You can create custom validators by extending `ComposedValSan` from valsan. See the [valsan documentation](../valsan/README.md) for more details.

## Authentication

api-machine provides a declarative authentication system with cascading support across server, router, and endpoint levels:

```typescript
class SecureRouter extends BaseApiRouter {
  override path = '/api';
  override authentication = new BearerAuthenticationScheme({
    checkToken: async (token: string) => await validateToken(token),
  });
  
  async routes() {
    return [ProtectedEndpoint];
  }
}
```

**Key Features:**
- **Cascading authentication** - Server → Router → Endpoint priority
- **Bearer token support** - Built-in Bearer authentication scheme
- **OpenAPI integration** - Automatic security scheme generation
- **Public routes** - Set `authentication = null` to bypass parent auth
- **Custom schemes** - Extend `AuthenticationScheme` for custom auth

See **[Authentication Documentation](docs/authentication.md)** for complete usage, cascading examples, and custom authentication schemes.

## Middleware

Routers and endpoints support Express middleware for logging, validation, and more. See [Middleware Support](docs/middleware.md) for usage and examples.

## Contributing & Development

See [contributing.md](docs/contributing/contributing.md) for information on how to develop or contribute to this project!
