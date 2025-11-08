import { BaseApiRouter } from '../../src/index';
import { UsersRouter } from './users/users-router';

/**
 * Complete Example - API Router
 *
 * Groups all domain routers under /api, demonstrating:
 * - Domain-driven organization
 * - Nested routers
 * - Separation of concerns
 */
export class ApiRouter extends BaseApiRouter {
	override path = '/api';

	async routes() {
		return [UsersRouter];
	}
}
