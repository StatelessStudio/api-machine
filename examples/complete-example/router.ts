import { BaseApiRouter, HealthCheckEndpoint } from '../../src/index';
import { UsersRouter } from './users/users-router';
// eslint-disable-next-line max-len
import { ExpressFeaturesRouter } from './express-features/express-features-router';

/**
 * Complete Example - API Router
 *
 * Groups all domain routers under /api, demonstrating:
 * - Domain-driven organization
 * - Nested routers
 * - Separation of concerns
 * - Pre-built endpoints (health check)
 */
export class ApiRouter extends BaseApiRouter {
	override path = '/api';

	async routes() {
		return [UsersRouter, ExpressFeaturesRouter, HealthCheckEndpoint];
	}
}
