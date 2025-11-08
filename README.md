# ts-rest - REST API Server Framework

A lightweight, TypeScript-first REST API framework built on Express with a class-based routing architecture.

## Installation

```bash
npm i ts-rest
```

## Features

- **TypeScript-First**: Fully typed API development with TypeScript
- **Class-Based Architecture**: Organize your API with classes for servers, routers, and endpoints
- **Built on Express**: Leverages the power and ecosystem of Express.js
- **Secure by Default**: Automatic security headers and server fingerprinting protection
- **CORS Support**: Built-in CORS handling
- **Error Handling**: Automatic error handling with standardized responses
- **Configurable**: Flexible configuration for ports, payload sizes, and logging

## Quick Start

See the [Quick Start Example](examples/quick-start/) for a complete, runnable example.

Here's the basic structure:

### 1. Servers

```typescript
class MyApiServer extends RestServer {
	override async routes() {
		return [MyRouter];
	}
}
```

### 2. Routers

```typescript
class MyRouter extends BaseApiRouter {
	override path = '/api';

	override async routes() {
		return [HelloEndpoint, UsersEndpoint];
	}
}
```

### 3. Endpoints

```typescript
class HelloEndpoint extends BaseApiEndpoint {
	override path = '/hello';

	override async handle(request, response) {
		return { message: 'Hello, World!' };
	}
}
```

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

## Configuration

### Server Options
#### port `number = 5000`

The port number on which the server will listen for incoming requests.

#### maxPayloadSizeMB `number = 10`

Maximum size in megabytes for JSON request payloads that the server will accept.

#### maxUrlEncodedSizeMB `number = 1`

Maximum size in megabytes for URL-encoded request payloads that the server will accept.

#### log `LogInterface = console`

Custom logger interface for handling server logging (e.g. `ts-tiny-log`). Must implement the LogInterface contract.

#### securityHeaders `SecurityHeadersOptions`

Configuration for HTTP security headers. By default, ts-rest is **secure by default** with:
- X-Powered-By header removed (prevents server fingerprinting)
- X-Content-Type-Options: nosniff (prevents MIME sniffing)
- X-Frame-Options: DENY (prevents clickjacking)
- X-XSS-Protection: 1; mode=block (legacy XSS protection)

See **[Security Headers Documentation](docs/security-headers.md)** for detailed configuration options and best practices.

### Example with Options

```typescript
const server = new MyServer({
  port: 8080,
  maxPayloadSizeMB: 20,
  maxUrlEncodedSizeMB: 2,
  log: myCustomLogger
});
```

## API Summary

### RestServer

Abstract class for creating REST API servers.

**Methods:**
- `start()`: Starts the server
- `stop()`: Stops the server
- `routes()`: Abstract method to define routers (must be implemented)

### BaseApiRouter

Abstract class for creating route groups.

**Properties:**
- `path`: The base path for the router (e.g., `/api`)

**Methods:**
- `routes()`: Abstract method to define endpoints (must be implemented)

### BaseApiEndpoint

Abstract class for creating API endpoints.

**Properties:**
- `path`: The endpoint path (default: `''`)
- `method`: The HTTP method (default: `GET`). Can be:
	- `EndpointMethods.GET`
	- `EndpointMethods.POST`
	- `EndpointMethods.PATCH`
	- `EndpointMethods.PUT`
	- `EndpointMethods.DELETE`

**Methods:**
- `handle(request, response, next)`: Abstract method to handle requests (must be implemented)

#### Using Different HTTP Methods

ts-rest provides convenience classes for each HTTP method with appropriate default status codes:

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

**Available Endpoint Classes:**
- `GetEndpoint` - GET requests (200 OK)
- `PostEndpoint` - POST requests (201 Created)
- `PutEndpoint` - PUT requests (200 OK)
- `PatchEndpoint` - PATCH requests (200 OK)
- `DeleteEndpoint` - DELETE requests (204 No Content)
- `HealthCheckEndpoint` - Pre-built health check endpoint (GET /health)

You can also use `BaseApiEndpoint` and manually set the `method` and `statusCode` properties if needed for custom behavior.

#### Pre-Built Endpoints

##### HealthCheckEndpoint

A ready-to-use health check endpoint that returns system status information. Simply include it in your router:

```typescript
import { BaseApiRouter, HealthCheckEndpoint } from 'ts-rest';

class MyRouter extends BaseApiRouter {
	override path = '/api';
	
	async routes() {
		return [
			HealthCheckEndpoint,  // Available at GET /api/health
			// ... other endpoints
		];
	}
}
```

**Response Format:**
```json
{
	"status": "ok",
	"timestamp": "2025-11-08T12:00:00.000Z",
	"uptime": 123.45,
	"environment": "development"
}
```

**Customizing the Path:**
```typescript
class CustomHealthCheck extends HealthCheckEndpoint {
	override path = '/status';  // Available at GET /api/status
}
```

For advanced usage, extending the health check with custom checks, and deployment examples (Kubernetes, Docker, monitoring), see the **[Health Check Endpoint Documentation](docs/health-check-endpoint.md)**.

## Error Handling

ts-rest provides a comprehensive set of HTTP error classes for standardized error responses. All errors extend `HTTPError` and automatically format responses with proper status codes and headers.

```typescript
import { NotFoundError, BadRequestError, UnauthorizedError } from 'ts-rest';

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
- 29 built-in error classes covering HTTP status codes 400-451
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

## Contributing & Development

See [contributing.md](docs/contributing/contributing.md) for information on how to develop or contribute to this project!
