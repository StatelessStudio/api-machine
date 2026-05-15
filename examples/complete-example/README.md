# Complete Example

This comprehensive example demonstrates all major features of the api-machine framework including domain-driven organization, multiple routers, all HTTP methods, route parameters, error handling, validation, custom logging, and Express integration. It showcases a complete REST API with organized domain structure.

## Setup & Run

From the root of the project, run:

```bash
npx ts-node examples/complete-example
```

The server will start on `http://localhost:3000`.

## Test the Endpoints

### User CRUD Operations

```bash
# List all users
curl http://localhost:3000/api/users

# Get a specific user by ID
curl http://localhost:3000/api/users/123

# Create a new user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'

# Update a user
curl -X PUT http://localhost:3000/api/users/123 \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@example.com"}'

# Delete a user
curl -X DELETE http://localhost:3000/api/users/123
```

### Error Handling

```bash
# Test validation errors
curl http://localhost:3000/api/users/0  # 400 Bad Request
curl http://localhost:3000/api/users/999  # 404 Not Found

# Test invalid POST data
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{}'  # Missing required fields

curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"invalid"}'  # Invalid email format
```

### Express Integration

```bash
# Test header access and manipulation
curl http://localhost:3000/api/express/headers \
  -H "X-Custom-Header: my-value" -v

# Test query parameter parsing
curl "http://localhost:3000/api/express/search?q=test&page=2&limit=20"
```

### Health Check

```bash
# Check service health
curl http://localhost:3000/api/health
```

### Dependency Injection

API-Machine uses `hidi`. You can register dependencies at the server, router or endpoint level.

```typescript
class MyService {
	...
}

class MyRouter extends BaseApiRouter {
	override inject() {
		super.inject();

		// Register a dependency at the router level
		this.container.register(MyService, new MyService());
	}
}

class MyEndpoint extends BaseApiEndpoint {
	protected myService: MyService;

	override inject() {
		super.inject();

		this.myService = this.container.require(MyService);
	}

	async handle(request: ApiRequest, response: ApiResponse) {
		this.myService.performAction();
	}
}
```

### Bearer Token Authentication (Inline, Stateless)

Bearer authentication validates a token on every request without maintaining session state.

```bash
# Test protected endpoint with valid token
curl -H "Authorization: Bearer demo-token" \
  http://localhost:3000/api/bearer/protected

# Test without token (should return 401)
curl http://localhost:3000/api/bearer/protected

# Public endpoint in bearer router (no auth required)
curl http://localhost:3000/api/bearer/public
```

### OAuth2 Session-Based Authentication (Stateful)

Session-based authentication uses a multi-step OAuth2-like flow to obtain a session, then validates it on each request.

```bash
# Step 1: Get a challenge
CHALLENGE=$(curl -s -X POST http://localhost:3000/oauth/challenge \
  -H "Content-Type: application/json" -d '{}' | \
  grep -o '"challenge":"[^"]*"' | cut -d'"' -f4)

# Step 2: Authorize with credentials
CODE=$(curl -s -X POST http://localhost:3000/oauth/authorize \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"demo\", \"password\": \"demo\", \"challenge\": \"$CHALLENGE\"}" | \
  grep -o '"code":"[^"]*"' | cut -d'"' -f4)

# Step 3: Exchange code for session
SESSIONID=$(curl -s -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"$CODE\"}" | \
  grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)

# Step 4: Access protected resource with session
curl -s -H "Cookie: sessionId=$SESSIONID" \
  http://localhost:3000/oauth/protected && echo ""

# Demo credentials: demo/demo or admin/admin
```

## Key Points

### Domain-Driven Organization
- Endpoints organized by domain (users, express-features)
- Each domain has its own router
- Routers group related endpoints under a common path
- Demonstrates scalable project structure

### HTTP Methods
- **GET**: Default method for reading data
- **POST**: Override `register()` method to create resources
- **PUT**: Override `register()` method to update resources
- **DELETE**: Override `register()` method to delete resources

### Route Parameters
- Use Express-style route parameters like `:id` in endpoint paths
- Paths are relative to their router (e.g., `/:id` under `/api/users` becomes `/api/users/:id`)
- Access via `request.params.id`

### Error Handling & Validation
- Validate input before processing
- Return appropriate HTTP status codes (400, 404, etc.)
- Use consistent error response format with `error`, `code`, and `timestamp`
- Use `return response.status().json()` for error responses

### Custom Logging
- The server uses `ts-tiny-log` with custom configuration
- Logger is configured in `server.ts` with timestamps and log levels
- Demonstrates how to integrate custom loggers that implement `LogInterface`

### Express Integration
- Full access to Express request/response objects
- Access headers via `request.headers`
- Parse query parameters via `request.query`
- Set response headers with `response.setHeader()`

### Server Configuration
- Custom port configuration
- Payload size limits (`maxPayloadSizeMB`)
- Custom logger integration

## File Structure

```
complete-example/
├── index.ts                                   # Entry point
├── server.ts                                  # Server with custom logger
├── router.ts                                  # Main router (groups domain routers)
├── authentication.ts                          # Bearer and OAuth2 auth schemes
├── users/                                     # User management domain
│   ├── users-router.ts                        # Groups under /api/users
│   ├── list-users-endpoint.ts                 # GET /api/users
│   ├── get-user-endpoint.ts                   # GET /api/users/:id
│   ├── create-user-endpoint.ts                # POST /api/users
│   ├── update-user-endpoint.ts                # PUT /api/users/:id
│   └── delete-user-endpoint.ts                # DELETE /api/users/:id
└── express-features/                          # Express integration domain
    ├── express-features-router.ts             # Groups under /api/express
    ├── headers-endpoint.ts                    # GET /api/express/headers
    └── query-params-endpoint.ts               # GET /api/express/search
```

## Learning Path

After completing the quick-start example, this example demonstrates:
1. How to organize endpoints using domain-driven design
2. How to create and nest multiple routers
3. How to implement full CRUD operations
4. How to override HTTP methods beyond GET
5. How to validate input and handle errors gracefully
6. How to configure and use custom loggers
7. How to leverage Express features within your endpoints
8. How to implement Bearer token authentication (inline, stateless)
9. How to implement OAuth2 session-based authentication (stateful, multi-step)
10. Best practices for structuring a production-ready API with authentication

## Authentication Approaches

This example demonstrates two authentication approaches:

### Bearer Token (Inline) Authentication
- **When to use**: Stateless APIs, JWT validation, API key authentication
- **How it works**: Token is validated on every request
- **Credentials**: Bearer token in Authorization header
- **Session**: None - token itself is the credential
- **Example**: `authentication.ts` - `BearerAuthRouter`

### OAuth2 Session-Based Authentication
- **When to use**: Stateful flows, user login, multi-factor auth
- **How it works**: Multi-step flow to obtain session, then session is validated
- **Credentials**: Username/password exchanged for session
- **Session**: Server-side session ID in cookies
- **Example**: `authentication.ts` - `OAuth2Router` and `oauth2Scheme`
