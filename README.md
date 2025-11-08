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

**Methods:**
- `handle(request, response, next)`: Abstract method to handle requests (must be implemented)

## Contributing & Development

See [contributing.md](docs/contributing/contributing.md) for information on how to develop or contribute to this project!
