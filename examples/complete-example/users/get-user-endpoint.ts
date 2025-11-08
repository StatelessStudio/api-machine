import { ApiRequest, ApiResponse, GetEndpoint } from '../../../src/index';
import { usersRepo } from './users-repository';

/**
 * Complete Example - Get User Endpoint
 *
 * Retrieves a single user by ID using route parameters.
 * Accessible at GET /api/users/:id
 */
export class GetUserEndpoint extends GetEndpoint {
	override path = '/:id';

	async handle(request: ApiRequest, response: ApiResponse) {
		const userId = parseInt(request.params['id'], 10);
		const user = usersRepo[userId];

		if (!user) {
			return response.status(404).json({
				error: 'User not found',
				code: 'NOT_FOUND',
				timestamp: new Date().toISOString(),
			});
		}

		return user;
	}
}
