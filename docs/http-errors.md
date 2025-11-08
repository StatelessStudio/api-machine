# HTTP Error Handling

The ts-rest framework provides a comprehensive set of HTTP error classes for consistent error handling across your API.

## Overview

All HTTP error classes extend from the base `HTTPError` class and follow a consistent constructor pattern:

```typescript
new ErrorClass(message: string, options: ErrorOptions = {})
```

Where `ErrorOptions` includes:
- `headers?: Record<string, string>` - Custom HTTP headers
- `details?: unknown` - Additional error details for logging/debugging

## Basic Usage

### Simple Errors

Most error classes only need a message:

```typescript
import {
    BadRequestError,
    NotFoundError,
    ConflictError
} from 'ts-rest';

// 400 Bad Request
throw new BadRequestError('Invalid input format');

// 404 Not Found
throw new NotFoundError('User not found');

// 409 Conflict
throw new ConflictError('Email already exists');
```

### Errors with Details

Add contextual information via the `details` option:

```typescript
import {
    NotFoundError,
    UnprocessableEntityError
} from 'ts-rest';

// Include the missing resource ID
throw new NotFoundError('User not found', {
	details: { userId: 123 }
});

// Include validation errors
throw new UnprocessableEntityError('Validation failed', {
	details: {
		errors: [
			{ field: 'email', message: 'Invalid email format' },
			{ field: 'age', message: 'Must be 18 or older' }
		]
	}
});
```

### Errors with Custom Headers

Add custom headers for additional metadata:

```typescript
import { BadRequestError } from 'ts-rest';

throw new BadRequestError('Request failed', {
	headers: {
		'X-Request-Id': requestId,
		'X-API-Version': '2.0'
	},
	details: { reason: 'Invalid JSON' }
});
```

## Special Error Classes

Some error classes have extended options for setting specific HTTP headers.

### UnauthorizedError (401)

```typescript
import { UnauthorizedError } from 'ts-rest';

// Basic usage
throw new UnauthorizedError('Invalid token');

// Custom realm (sets WWW-Authenticate header)
throw new UnauthorizedError('Invalid token', {
	realm: 'API Access'
});
// Headers: { 'WWW-Authenticate': 'Bearer realm="API Access"' }

// Custom authentication scheme
throw new UnauthorizedError('Invalid credentials', {
	realm: 'Admin Portal',
	scheme: 'Basic'
});
// Headers: { 'WWW-Authenticate': 'Basic realm="Admin Portal"' }

// With additional details
throw new UnauthorizedError('Token expired', {
	realm: 'API',
	details: { 
		expiredAt: '2024-01-01T00:00:00Z',
		tokenId: 'abc123'
	}
});
```

### MethodNotAllowedError (405)

```typescript
import { MethodNotAllowedError } from 'ts-rest';

// Basic usage
throw new MethodNotAllowedError();

// With allowed methods (sets Allow header)
throw new MethodNotAllowedError('DELETE not supported', {
	allowedMethods: ['GET', 'POST', 'PUT']
});
// Headers: { 'Allow': 'GET, POST, PUT' }

// With details
throw new MethodNotAllowedError('Method not supported', {
	allowedMethods: ['GET', 'POST'],
	details: { attemptedMethod: 'DELETE', path: '/api/users/1' }
});
```

### TooManyRequestsError (429)

```typescript
import { TooManyRequestsError } from 'ts-rest';

// Basic usage
throw new TooManyRequestsError();

// With retry-after (sets Retry-After header)
throw new TooManyRequestsError('Rate limit exceeded', {
	retryAfter: 60  // seconds
});
// Headers: { 'Retry-After': '60' }

// With rate limit details
throw new TooManyRequestsError('Too many requests', {
	retryAfter: 120,
	details: {
		limit: 100,
		current: 150,
		resetAt: '2024-01-01T12:00:00Z'
	}
});
```

### UnsupportedMediaTypeError (415)

```typescript
import { UnsupportedMediaTypeError } from 'ts-rest';

// Basic usage
throw new UnsupportedMediaTypeError();

// With accepted types (sets Accept header)
throw new UnsupportedMediaTypeError('Invalid content type', {
	acceptedTypes: ['application/json', 'application/xml']
});
// Headers: { 'Accept': 'application/json, application/xml' }

// With received content type
throw new UnsupportedMediaTypeError('Unsupported media type', {
	acceptedTypes: ['application/json'],
	details: { receivedType: 'text/plain' }
});
```

### RangeNotSatisfiableError (416)

```typescript
import { RangeNotSatisfiableError } from 'ts-rest';

// Basic usage
throw new RangeNotSatisfiableError();

// With content range (sets Content-Range header)
throw new RangeNotSatisfiableError('Invalid range', {
	contentRange: 'bytes */1000'
});
// Headers: { 'Content-Range': 'bytes */1000' }

// With range details
throw new RangeNotSatisfiableError('Range not satisfiable', {
	contentRange: 'bytes */5000',
	details: { requestedRange: 'bytes=6000-7000' }
});
```

### ProxyAuthenticationRequiredError (407)

```typescript
import { ProxyAuthenticationRequiredError } from 'ts-rest';

// Default realm
throw new ProxyAuthenticationRequiredError();
// Headers: { 'Proxy-Authenticate': 'Basic realm="Proxy"' }

// Custom realm
throw new ProxyAuthenticationRequiredError('Proxy auth required', {
	realm: 'Corporate Proxy'
});
// Headers: { 'Proxy-Authenticate': 'Basic realm="Corporate Proxy"' }
```

### UpgradeRequiredError (426)

```typescript
import { UpgradeRequiredError } from 'ts-rest';

// Default protocol
throw new UpgradeRequiredError();
// Headers: { 'Upgrade': 'TLS/1.0' }

// Custom protocol
throw new UpgradeRequiredError('Please upgrade', {
	upgradeProtocol: 'HTTP/2.0'
});
// Headers: { 'Upgrade': 'HTTP/2.0' }
```

## Complete Error Class List

### 4xx Client Errors

| Class | Status | Default Message |
|-------|--------|----------------|
| `BadRequestError` | 400 | Bad Request |
| `UnauthorizedError` | 401 | Unauthorized |
| `PaymentRequiredError` | 402 | Payment Required |
| `ForbiddenError` | 403 | Forbidden |
| `NotFoundError` | 404 | Not Found |
| `MethodNotAllowedError` | 405 | Method Not Allowed |
| `NotAcceptableError` | 406 | Not Acceptable |
| `ProxyAuthenticationRequiredError` | 407 | Proxy Authentication Required |
| `RequestTimeoutError` | 408 | Request Timeout |
| `ConflictError` | 409 | Conflict |
| `GoneError` | 410 | Gone |
| `LengthRequiredError` | 411 | Length Required |
| `PreconditionFailedError` | 412 | Precondition Failed |
| `PayloadTooLargeError` | 413 | Payload Too Large |
| `URITooLongError` | 414 | URI Too Long |
| `UnsupportedMediaTypeError` | 415 | Unsupported Media Type |
| `RangeNotSatisfiableError` | 416 | Range Not Satisfiable |
| `ExpectationFailedError` | 417 | Expectation Failed |
| `ImATeapotError` | 418 | I'm a teapot |
| `MisdirectedRequestError` | 421 | Misdirected Request |
| `UnprocessableEntityError` | 422 | Unprocessable Entity |
| `LockedError` | 423 | Locked |
| `FailedDependencyError` | 424 | Failed Dependency |
| `TooEarlyError` | 425 | Too Early |
| `UpgradeRequiredError` | 426 | Upgrade Required |
| `PreconditionRequiredError` | 428 | Precondition Required |
| `TooManyRequestsError` | 429 | Too Many Requests |
| `RequestHeaderFieldsTooLargeError` | 431 | Request Header Fields Too Large |
| `UnavailableForLegalReasonsError` | 451 | Unavailable For Legal Reasons |

## In Endpoint Handlers

```typescript
import { ApiRequest, ApiResponse, GetEndpoint } from 'ts-rest';
import { NotFoundError, ForbiddenError } from 'ts-rest';

export class GetUserEndpoint extends GetEndpoint {
	override path = '/:id';

	async handle(request: ApiRequest, response: ApiResponse) {
		const userId = parseInt(request.params['id'], 10);
		
		// Check permissions
		if (!request.user.canViewUser(userId)) {
			throw new ForbiddenError('Access denied', {
				details: { 
					userId, 
					requiredPermission: 'users:read' 
				}
			});
		}
		
		// Find user
		const user = await this.userRepo.findById(userId);
		if (!user) {
			throw new NotFoundError('User not found', {
				details: { userId }
			});
		}
		
		return user;
	}
}
```

## Error Response Format

The server automatically formats HTTPError instances into JSON responses:

```json
{
	"error": "NotFoundError",
	"message": "User not found",
	"timestamp": "2024-11-08T12:34:56.789Z",
	"options": {
		"details": {
			"userId": 123
		}
	}
}
```

HTTP headers from the error are automatically set in the response:

```
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="API"
Content-Type: application/json

{
	"error": "UnauthorizedError",
	"message": "Invalid token",
	"timestamp": "2024-11-08T12:34:56.789Z",
	"options": {}
}
```

## Creating Custom Error Classes

Extend `HTTPError` to create custom error classes:

```typescript
import { HTTPError } from 'ts-rest';
import { HttpErrorOptions } from 'ts-rest';

export interface MyCustomErrorOptions extends HttpErrorOptions {
	errorCode?: string;
	retryable?: boolean;
}

export class MyCustomError extends HTTPError {
	public readonly errorCode?: string;
	public readonly retryable?: boolean;

	constructor(
		message: string,
		options: MyCustomErrorOptions = {}
	) {
		super(message, options);
		this.errorCode = options.errorCode;
		this.retryable = options.retryable ?? false;
	}

	public override getStatusCode(): number {
		return 400;  // Your status code
	}

	// Override getResponseJson to include custom fields
	public override getResponseJson() {
		const json = super.getResponseJson();
		return {
			...json,
			errorCode: this.errorCode,
			retryable: this.retryable,
		};
	}
}

// Usage
throw new MyCustomError('Something went wrong', {
	errorCode: 'CUSTOM_001',
	retryable: true,
	details: { /* ... */ }
});
```

## Best Practices

1. **Use Specific Error Classes**: Choose the most appropriate error class for your situation
2. **Include Details**: Add contextual information via `details` for debugging and logging
3. **Override Default Headers**: User-provided headers always take precedence over default headers
4. **Consistent Messages**: Use clear, user-friendly error messages
5. **Don't Leak Secrets**: Avoid exposing sensitive information in error messages or details

```typescript
// Good
throw new NotFoundError('Resource not found', {
	details: { resourceType: 'user', resourceId: id }
});

// Bad - exposes internal details
throw new NotFoundError('User with email john@example.com not found in database users table');

// Bad - exposes sensitive data
throw new UnauthorizedError('Invalid token', {
	details: { token: request.headers.authorization }  // Don't expose tokens!
});

// Override default headers
throw new UnauthorizedError('Custom auth', {
	realm: 'API',  // Would set 'Bearer realm="API"'
	headers: {
		'WWW-Authenticate': 'Custom scheme'  // This overrides the default
	}
});
```
