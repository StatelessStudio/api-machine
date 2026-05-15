import { ApiRequest, ApiResponse, GetEndpoint } from '../../../src/index';
import { NotFoundError } from '../../../src/error';
import { UsersRepository } from './users-repository';
import { IntegerValidator, EmailValidator, ObjectValSan } from 'valsan';
import { NameValSan } from './name-valsan';

/**
 * Complete Example - Get User Endpoint
 *
 * Retrieves a single user by ID using route parameters.
 * Accessible at GET /api/users/:id
 */
export class GetUserEndpoint extends GetEndpoint {
	override path = '/:id';

	protected usersRepo: UsersRepository;

	override responseExample = {
		id: 1,
		name: 'Alice',
		email: 'alice@example.com',
		created: new Date('2023-01-01'),
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
		const userId = parseInt(request.params['id'] as string, 10);
		const user = this.usersRepo.getById(userId);

		if (!user) {
			// Throw HTTPError - server will automatically format response
			throw new NotFoundError('User not found', { details: { userId } });
		}

		return user;
	}
}
