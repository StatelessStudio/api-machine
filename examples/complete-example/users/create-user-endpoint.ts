import { ApiRequest, ApiResponse, PostEndpoint } from '../../../src/index';
import { UsersRepository } from './users-repository';
import { ObjectValSan, EmailValidator, IntegerValidator } from 'valsan';
import { NameValSan } from './name-valsan';

/**
 * Complete Example - Create User Endpoint (POST)
 *
 * Accessible at POST /api/users/
 */
export class CreateUserEndpoint extends PostEndpoint {
	override path = '/';

	protected usersRepo: UsersRepository;

	override bodyExample = {
		name: 'John Doe',
		email: 'john@example.com',
	};

	override body = new ObjectValSan({
		schema: {
			name: new NameValSan(),
			email: new EmailValidator(),
		},
	});

	override responseExample = {
		id: 3,
		name: 'John Doe',
		email: 'john@example.com',
		created: new Date(),
	};

	override response = new ObjectValSan({
		schema: {
			id: new IntegerValidator(),
			name: new NameValSan(),
			email: new EmailValidator(),
		},
	});

	override inject(): void {
		this.usersRepo = this.container.require(UsersRepository);
	}

	async handle(request: ApiRequest, response: ApiResponse) {
		const { name, email } = request.body;

		// Create and add to repository
		const newUser = this.usersRepo.add({ name, email });

		// Return new user (PostEndpoint automatically sets 201 status)
		return newUser;
	}
}
