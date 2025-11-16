import { ApiRequest, ApiResponse, GetEndpoint } from '../../../src/index';
import { NotFoundError } from '../../../src/error';
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
			// Throw HTTPError - server will automatically format response
			throw new NotFoundError('User not found', { details: { userId } });
		}

		return user;
	}
}
