import { ApiRequest, ApiResponse, PostEndpoint } from '../../../src/index';
import { usersRepo, User } from './users-repository';

/**
 * Complete Example - Create User Endpoint (POST)
 *
 * Accessible at POST /api/users/
 */
export class CreateUserEndpoint extends PostEndpoint {
	override path = '/';

	async handle(request: ApiRequest, response: ApiResponse) {
		const { name, email } = request.body;

		// Generate new ID
		const newId = Math.max(...Object.keys(usersRepo).map(Number)) + 1;

		// Create new user
		const newUser: User = {
			id: newId,
			name,
			email,
			created: new Date(),
		};

		// Add to repository
		usersRepo[newId] = newUser;

		// Return new user (PostEndpoint automatically sets 201 status)
		return newUser;
	}
}
