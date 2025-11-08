import { ApiRequest, ApiResponse, PutEndpoint } from '../../../src/index';
import { usersRepo } from './users-repository';

/**
 * Complete Example - Update User Endpoint (PUT)
 *
 * Accessible at PUT /api/users/:id
 */
export class UpdateUserEndpoint extends PutEndpoint {
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

		// Update user properties
		const { name, email } = request.body;
		if (name) {
			user.name = name;
		}

		if (email) {
			user.email = email;
		}

		return user;
	}
}
