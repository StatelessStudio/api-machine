import { ApiRequest, ApiResponse, DeleteEndpoint } from '../../../src/index';
import { usersRepo } from './users-repository';

/**
 * Complete Example - Delete User Endpoint (DELETE)
 *
 * Accessible at DELETE /api/users/:id
 */
export class DeleteUserEndpoint extends DeleteEndpoint {
	override path = '/:id';

	async handle(request: ApiRequest, response: ApiResponse) {
		const userId = parseInt(request.params['id'], 10);
		const user = usersRepo[userId];

		if (!user) {
			return response.status(404).json({
				error: 'User not found',
				code: 'NOT_FOUND',
			});
		}

		// Delete user from repository
		delete usersRepo[userId];

		// DeleteEndpoint automatically sets 204 status
		return {};
	}
}
