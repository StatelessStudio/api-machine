# Health Check Endpoint

The `HealthCheckEndpoint` is a pre-built endpoint that provides a simple health check response for your REST API. This is useful for monitoring, load balancers, and orchestration systems that need to verify your service is running.

## Features

- **Ready to Use**: No configuration needed - just include it in your router
- **System Information**: Returns status, timestamp, uptime, and environment
- **Customizable**: Override the path or extend the response as needed
- **Secure**: Uses GET method with 200 OK status

## Basic Usage

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

## Response Format

```json
{
	"status": "ok",
	"timestamp": "2025-11-08T12:00:00.000Z",
	"uptime": 123.45,
	"environment": "development"
}
```

**Response Fields:**
- `status`: Always "ok" when the server is responding
- `timestamp`: Current time in ISO 8601 format
- `uptime`: Process uptime in seconds
- `environment`: Value of `NODE_ENV` environment variable (defaults to "development")

## Customization

### Custom Path

Override the path to use a different endpoint URL:

```typescript
class MyHealthCheck extends HealthCheckEndpoint {
	override path = '/status';  // Available at GET /api/status
}
```

### Extended Response

Extend the endpoint to add custom health information:

```typescript
import { HealthCheckEndpoint, ApiRequest, ApiResponse } from 'ts-rest';

class ExtendedHealthCheck extends HealthCheckEndpoint {
	override path = '/health';
	
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async handle(_request: ApiRequest, _response: ApiResponse) {
		const baseHealth = await super.handle(_request, _response);
		
		return {
			...baseHealth,
			version: '1.0.0',
			database: await this.checkDatabase(),
			cache: await this.checkCache(),
		};
	}
	
	private async checkDatabase(): Promise<string> {
		// Check database connection
		return 'connected';
	}
	
	private async checkCache(): Promise<string> {
		// Check cache connection
		return 'connected';
	}
}
```

### Custom Health Logic

Replace the entire response with your own health check logic:

```typescript
class CustomHealthCheck extends HealthCheckEndpoint {
	override path = '/health';
	
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async handle(_request: ApiRequest, response: ApiResponse) {
		const isHealthy = await this.performHealthChecks();
		
		if (!isHealthy) {
			response.status(503);  // Service Unavailable
			return {
				status: 'unhealthy',
				timestamp: new Date().toISOString(),
			};
		}
		
		return {
			status: 'healthy',
			timestamp: new Date().toISOString(),
			checks: {
				database: 'ok',
				cache: 'ok',
				api: 'ok',
			},
		};
	}
	
	private async performHealthChecks(): Promise<boolean> {
		// Implement your health check logic
		return true;
	}
}
```

## Use Cases

### Load Balancers

Configure your load balancer to poll the health check endpoint:

```bash
curl http://localhost:3000/api/health
```

### Kubernetes

Use the health check endpoint for liveness and readiness probes:

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Docker Healthcheck

Add a health check to your Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

### Monitoring

Use monitoring tools to track service availability:

```bash
# Prometheus
curl http://localhost:3000/api/health | jq '.status'

# Nagios, Zabbix, etc.
check_http -H localhost -p 3000 -u /api/health -s "ok"
```

## Best Practices

1. **Keep it Simple**: The health check should be fast and lightweight
2. **Status Codes**: Return 200 for healthy, 503 for unhealthy
3. **Minimal Dependencies**: Avoid complex checks that might fail unnecessarily
4. **Separate Readiness**: Consider separate endpoints for liveness vs readiness
5. **Authentication**: Health checks typically don't require authentication

## Example: Multiple Health Endpoints

```typescript
class HealthRouter extends BaseApiRouter {
	override path = '/';
	
	async routes() {
		return [
			// Basic health check
			HealthCheckEndpoint,  // GET /health
			
			// Detailed health with dependencies
			class extends HealthCheckEndpoint {
				override path = '/health/detailed';
				
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				async handle(_request: ApiRequest, _response: ApiResponse) {
					return {
						status: 'ok',
						timestamp: new Date().toISOString(),
						uptime: process.uptime(),
						environment: process.env['NODE_ENV'] || 'development',
						dependencies: {
							database: 'connected',
							redis: 'connected',
							api: 'reachable',
						},
					};
				}
			},
			
			// Liveness probe (is the service running?)
			class extends HealthCheckEndpoint {
				override path = '/health/live';
			},
			
			// Readiness probe (is the service ready to accept traffic?)
			class extends HealthCheckEndpoint {
				override path = '/health/ready';
				
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				async handle(_request: ApiRequest, response: ApiResponse) {
					const isReady = await this.checkReadiness();
					
					if (!isReady) {
						response.status(503);
						return { status: 'not ready' };
					}
					
					return {
						status: 'ready',
						timestamp: new Date().toISOString(),
					};
				}
				
				private async checkReadiness(): Promise<boolean> {
					// Check if dependencies are ready
					return true;
				}
			},
		];
	}
}
```

## See Also

- [Quick Start Example](../examples/quick-start/README.md) - Includes HealthCheckEndpoint usage
- [Complete Example](../examples/complete-example/README.md) - Advanced endpoint patterns
- [HTTP Errors](./http-errors.md) - Error handling for health checks
