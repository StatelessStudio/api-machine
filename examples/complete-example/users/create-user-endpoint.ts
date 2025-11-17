import { ApiRequest, ApiResponse, PostEndpoint } from '../../../src/index';
import { usersRepo, User } from './users-repository';
import { ObjectSanitizer, EmailValidator, IntegerValidator } from 'valsan';
import { NameValSan } from './name-valsan';

/**
 * Complete Example - Create User Endpoint (POST)
 *
 * Accessible at POST /api/users/
 */
export class CreateUserEndpoint extends PostEndpoint {
	override path = '/';

	override bodyExample = {
		name: 'John Doe',
		email: 'john@example.com',
	};

	override body = new ObjectSanitizer({
		name: new NameValSan(),
		email: new EmailValidator(),
	});

	override responseExample = {
		id: 3,
		name: 'John Doe',
		email: 'john@example.com',
		created: new Date(),
	};

	override response = new ObjectSanitizer({
		id: new IntegerValidator(),
		name: new NameValSan(),
		email: new EmailValidator(),
	});

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
