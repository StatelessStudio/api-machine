import { BaseApiRouter } from '../../../src/index';
import { ListUsersEndpoint } from './list-users-endpoint';
import { GetUserEndpoint } from './get-user-endpoint';
import { CreateUserEndpoint } from './create-user-endpoint';
import { UpdateUserEndpoint } from './update-user-endpoint';
import { DeleteUserEndpoint } from './delete-user-endpoint';

/**
 * Users Router
 *
 * Groups all user-related endpoints, demonstrating:
 * - Full CRUD operations
 * - Different HTTP methods (GET, POST, PUT, DELETE)
 * - Route parameters
 * - Error handling and validation
 */
export class UsersRouter extends BaseApiRouter {
	override path = '/users';

	async routes() {
		return [
			ListUsersEndpoint,
			GetUserEndpoint,
			CreateUserEndpoint,
			UpdateUserEndpoint,
			DeleteUserEndpoint,
		];
	}
}
