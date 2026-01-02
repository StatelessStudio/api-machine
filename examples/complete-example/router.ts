import { BaseApiRouter, HealthCheckEndpoint } from '../../src/index';
import { UsersRouter } from './users/users-router';
// eslint-disable-next-line max-len
import { ExpressFeaturesRouter } from './express-features/express-features-router';
import { BearerAuthRouter } from './auth/inline-auth';
import { OAuth2Router } from './auth/session-auth';

/**
 * Complete Example - API Router
 *
 * Groups all domain routers under /api, demonstrating:
 * - Domain-driven organization
 * - Nested routers
 * - Separation of concerns
 * - Pre-built endpoints (health check)
 * - Bearer token authentication (/api/bearer)
 * - Session-based OAuth2 authentication (/oauth)
 */
export class ApiRouter extends BaseApiRouter {
	override path = '/api';

	async routes() {
		return [
			UsersRouter,
			ExpressFeaturesRouter,
			BearerAuthRouter,
			HealthCheckEndpoint,
		];
	}
}

/**
 * Main router combining API and authentication endpoints
 */
export class MainRouter extends BaseApiRouter {
	async routes() {
		return [
			// OAuth2 session-based authentication with endpoints
			OAuth2Router,
			// Main API
			ApiRouter,
		];
	}
}
