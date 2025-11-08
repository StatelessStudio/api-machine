import { ApiRequest, ApiResponse, GetEndpoint } from '../../../src/index';
import { usersRepo } from './users-repository';

/**
 * Complete Example - List Users Endpoint
 *
 * Returns a list of all users.
 * Accessible at GET /api/users/
 */
export class ListUsersEndpoint extends GetEndpoint {
	override path = '/';

	async handle(request: ApiRequest, response: ApiResponse) {
		return Object.values(usersRepo);
	}
}
