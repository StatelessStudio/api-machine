import { ApiRequest, ApiResponse, BaseApiEndpoint } from '../../../src/index';

/**
 * Quick Start Example - Users Endpoint
 *
 * Returns a list of users.
 * Accessible at GET /api/users
 */
export class UsersEndpoint extends BaseApiEndpoint {
	override path = '/users';

	async handle(request: ApiRequest, response: ApiResponse) {
		return [
			{ id: 1, name: 'John' },
			{ id: 2, name: 'Jane' },
		];
	}
}
